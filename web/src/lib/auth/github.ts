import * as z from "zod";
import * as jose from "jose";

const GITHUB_OIDC_ISSUER = "https://token.actions.githubusercontent.com";
const GITHUB_OIDC_JWKS_URI = `${GITHUB_OIDC_ISSUER}/.well-known/jwks`;

const GithubOIDCClaims = z.object({
    iss: z.string().nonempty(),
    aud: z.string().nonempty(),
    sub: z.string().nonempty(),
    repository: z.string().nonempty(),
    repository_owner: z.string().nonempty(),
    repository_owner_id: z.string().nonempty(),
    actor: z.string().nonempty(),
    actor_id: z.string().nonempty(),
    ref: z.string().nonempty(),
    sha: z.string().nonempty(),
    workflow: z.string().nonempty(),
    run_id: z.string().nonempty(),
    run_number: z.string().nonempty(),
    run_attempt: z.string().nonempty(),
    iat: z.number(),
    exp: z.number(),
    nbf: z.number(),
});

type GithubOIDCClaims = z.infer<typeof GithubOIDCClaims>;

export class GithubOIDCValidator {
    private rc_pat: string;
    private jwks: ReturnType<typeof jose.createRemoteJWKSet>; 

    public constructor(rc_pat: string) {
        this.rc_pat = rc_pat;
        this.jwks = jose.createRemoteJWKSet(new URL(GITHUB_OIDC_JWKS_URI));
    }

public async validate(jwt: string): Promise<GithubOIDCClaims> {
        const { payload } = await jose.jwtVerify(jwt, this.jwks, {
            issuer: GITHUB_OIDC_ISSUER,
            // TODO more validation
        });
        
        return GithubOIDCClaims.parse(payload);
    }
}
