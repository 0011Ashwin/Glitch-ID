import { Redis } from '@upstash/redis';
import type { Member } from '../types';

export const config = {
  runtime: 'edge',
};

const MEMBERS_KEY = 'members';

// Initialize Redis client from environment variables
// These must be set in your Vercel project settings
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export default async function handler(request: Request): Promise<Response> {
  const headers = { 
    'Content-Type': 'application/json',
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'Surrogate-Control': 'no-store',
  };

  try {
    if (request.method === 'GET') {
      const data = await redis.get(MEMBERS_KEY);
      const members = data ? JSON.parse(data as string) : [];
      return new Response(JSON.stringify({ members }), { status: 200, headers });

    } else if (request.method === 'POST') {
      const { members } = await request.json() as { members: Omit<Member, 'hackathonName'>[] };

      if (!Array.isArray(members)) {
        return new Response(JSON.stringify({ error: 'Invalid data format. "members" should be an array.' }), { status: 400, headers });
      }

      const newMembers: Member[] = members.map(memberData => ({
        ...memberData,
        hackathonName: 'Glitch 1.0',
      }));

      // Standard Redis requires data to be stringified
      await redis.set(MEMBERS_KEY, JSON.stringify(newMembers));
      return new Response(JSON.stringify({ message: 'Data saved successfully.' }), { status: 200, headers });

    } else if (request.method === 'DELETE') {
      await redis.del(MEMBERS_KEY);
      return new Response(JSON.stringify({ message: 'All data cleared.' }), { status: 200, headers });

    } else {
      const allowHeaders = { 'Allow': 'GET, POST, DELETE', ...headers };
      return new Response(`Method ${request.method} Not Allowed`, { status: 405, headers: allowHeaders });
    }
  } catch (error) {
    console.error('API Error:', error);
    // Check if the error is due to missing Redis credentials
    if (error instanceof Error && (error.message.includes('UPSTASH_REDIS_REST_URL') || error.message.includes('UPSTASH_REDIS_REST_TOKEN'))) {
       return new Response(JSON.stringify({ error: 'Redis database is not configured. Please set environment variables.' }), { status: 500, headers });
    }
    return new Response(JSON.stringify({ error: 'An internal server error occurred.' }), { status: 500, headers });
  }
}
