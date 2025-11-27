import * as z from 'zod';

import { RecurseResponse } from "$lib/rc_oauth";

const RECURSE_API_BASE_URL = "https://www.recurse.com/api/v1";

const GetProfilesResponse = z.array(RecurseResponse);

export class RecurseAPI {
    private pat: string;

    public constructor(pat: string) {
        this.pat = pat;
    }

    public async getUserByGithubId(githubId: string): Promise<RecurseResponse> {
        const res = await fetch(`${RECURSE_API_BASE_URL}/profiles?query=${githubId}`, {
            headers: {
                'Authorization': `Bearer ${this.pat}`
            }
        });
        if (!res.ok) {
            throw new Error(`Failed to fetch user by github id: ${res.statusText}`);
        }
        const body = await res.json();

        const profiles = GetProfilesResponse.parse(body).filter((profile) => profile.github === githubId);
        if (profiles.length === 0) {
            throw new Error(`No user found with github id: ${githubId}`);
        }
        if (profiles.length > 1) {
            throw new Error(`Multiple users found with github id: ${githubId}`);
        }
        return profiles[0];
    }
}