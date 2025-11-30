import { GithubOIDCValidator } from "$lib/auth/github";
import { Game } from "$lib/game";
import { RecurseAPIError } from "$lib/recurse";
import { GameManifest, PluginManifest } from "@rcade/api";
import type { RequestHandler } from "@sveltejs/kit";
import semver from "semver";
import { ZodError } from "zod";
import { Plugin } from "$lib/plugin";
import git from "isomorphic-git";
import http from 'isomorphic-git/http/web';
import LightningFS from '@isomorphic-git/lightning-fs';
import { env } from "$env/dynamic/private";
import * as jose from 'jose';
import { createPrivateKey } from "node:crypto";
import { fs, vol } from 'memfs';

const VALIDATOR = new GithubOIDCValidator();

// Helper function to generate JWT
async function generateGitHubAppJWT(appId: string, privateKey: string) {
    const now = Math.floor(Date.now() / 1000);

    const keyObject = createPrivateKey({
        key: privateKey,
        format: 'pem',
        type: 'pkcs1'
    });

    const pkcs8Key = keyObject.export({
        format: 'pem',
        type: 'pkcs8'
    }) as string;

    const key = await jose.importPKCS8(pkcs8Key, 'RS256');

    return await new jose.SignJWT({})
        .setProtectedHeader({ alg: 'RS256' })
        .setIssuedAt(now)
        .setExpirationTime(now + 600)
        .setIssuer(appId)
        .sign(key);
}

// Get installation access token
async function getInstallationToken(appId: string, privateKey: string, installationId: string) {
    const jwt = await generateGitHubAppJWT(appId, privateKey);

    const response = await fetch(
        `https://api.github.com/app/installations/${installationId}/access_tokens`,
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${jwt}`,
                'Accept': 'application/vnd.github+json',
                'X-GitHub-Api-Version': '2022-11-28',
                'User-Agent': "RCade Community"
            },
        }
    );

    const data = await response.text();

    try {
        return (JSON.parse(data)).token;
    } catch (err) {
        throw new Error(data);
    }
}

const GITHUB_TOKEN = await getInstallationToken(
    env.GITHUB_APP_ID!,
    env.GITHUB_APP_PRIVATE_KEY!,
    env.GITHUB_APP_INSTALLATION_ID!
);

function jsonResponse(body: object, status: number): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'Content-Type': 'application/json' }
    });
}

export const POST: RequestHandler = async ({ params, request }) => {
    const deploymentName = params.deployment_name ?? "";
    if (!deploymentName) {
        return jsonResponse({ error: 'Deployment name is required' }, 400);
    }

    const header = request.headers.get("Authorization");

    if (!header?.startsWith("Bearer ")) {
        return jsonResponse({ error: 'Missing or invalid Authorization header. Expected: Bearer <token>' }, 401);
    }

    const token = header.slice(7);
    if (!token) {
        return jsonResponse({ error: 'No GitHub OIDC JWT provided' }, 401);
    }

    let auth;
    try {
        auth = await VALIDATOR.validate(token);
    } catch (error) {
        if (error instanceof jose.errors.JOSEError) {
            console.error('OIDC validation failed:', error.code, error.message);
            return jsonResponse({ error: `Authentication failed: ${error.message}` }, 401);
        }
        if (error instanceof ZodError) {
            console.error('OIDC claims validation failed:', error.issues);
            return jsonResponse({ error: 'Invalid OIDC token claims' }, 401);
        }
        if (error instanceof RecurseAPIError) {
            console.error('Recurse API error:', error.code, error.message);
            return jsonResponse({ error: error.message }, error.statusCode);
        }
        throw error;
    }

    let body;

    try {
        body = await request.json();
    } catch (error) {
        if (error instanceof SyntaxError) {
            return jsonResponse({ error: 'Invalid JSON in request body' }, 400);
        }
        throw error;
    }

    let kind: "game" | "plugin" = "game";

    if ("kind" in body && body.kind === "plugin") {
        kind = "plugin";
    }

    let manifest;
    try {
        if (kind === "game") {
            manifest = GameManifest.parse(body);
        } else {
            manifest = PluginManifest.parse(body);
        }
    } catch (error) {
        if (error instanceof ZodError) {
            const issues = error.issues.map(i => `${i.path.join('.')}: ${i.message}`);
            return jsonResponse({ error: 'Invalid manifest', details: issues }, 400);
        }
        throw error;
    }

    if (deploymentName !== manifest.name) {
        return jsonResponse({ error: 'Deployment name does not match object name in manifest' }, 400);
    }

    let object;

    if (kind === "game") {
        object = await Game.byName(deploymentName);
    } else {
        object = await Plugin.byName(deploymentName);
    }

    try {
        let version: string;

        if (object == undefined) {
            version = manifest.version ?? "1.0.0";

            if (kind === "game") {
                object = await Game.new(manifest.name, auth);
            } else {
                object = await Plugin.new(manifest.name, auth);
            }
        } else {
            if (manifest.version) {
                version = manifest.version;
            } else {
                const latest = await object.latestVersionNumber();
                if (latest == undefined) {
                    version = "1.0.0";
                } else {
                    const bumped = semver.inc(latest, "patch");
                    if (bumped == null) {
                        console.error('Failed to increment version:', latest);
                        return jsonResponse({ error: `Unable to auto-increment version from '${latest}'` }, 500);
                    }
                    version = bumped;
                }
            }
        }

        const dir = '/repo';

        try {
            await git.clone({
                fs,
                http,
                dir,
                url: `https://github.com/${auth.repository}`,
            });

            const createRepoResponse = await fetch('https://api.github.com/orgs/rcade-community/repos', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github+json',
                    'X-GitHub-Api-Version': '2022-11-28',
                    'User-Agent': "RCade Community"
                },
                body: JSON.stringify({
                    name: deploymentName,
                    private: false, // or true if you want it private
                    auto_init: false, // important: don't initialize with README
                }),
            });

            // 422 status means repo already exists, which is fine
            if (!createRepoResponse.ok && createRepoResponse.status !== 422) {
                throw new Error(`Failed to create repository: ${await createRepoResponse.text()}`);
            }

            await git.addRemote({
                fs,
                dir,
                remote: 'rcade-community',
                url: `https://github.com/rcade-community/${deploymentName}`,
            });

            const branches = await git.listBranches({ fs, dir });

            for (const branch of branches.filter(b => b !== 'HEAD')) {
                const new_branch = `${version}/${branch}`

                await git.renameBranch({
                    fs,
                    dir,
                    oldref: branch,
                    ref: new_branch,
                });

                await git.push({
                    fs,
                    http,
                    dir,
                    remote: 'rcade-community',
                    ref: new_branch,
                    onAuth: () => ({
                        username: 'x-access-token',
                        password: GITHUB_TOKEN
                    }),
                });
            }
        } catch (error) {
            return jsonResponse({ error: `Failed to clone your repository. ${error}` }, 500);
        }

        vol.reset();

        const { upload_url, expires } = await object.publishVersion(version, manifest as any);

        return jsonResponse({ upload_url, expires }, 200);
    } catch (error) {
        if (error instanceof Error && error.message === "Version mismatch") {
            return jsonResponse({ error: 'Manifest version does not match the target version' }, 409);
        }

        console.error('Deployment failed:', error);
        return jsonResponse({ error: 'Deployment failed. Please try again or contact support.' }, 500);
    }
};