import { kv } from '@vercel/kv';
import type { Member } from '../types';

export const config = {
  runtime: 'edge',
};

const MEMBERS_KEY = 'members';

export default async function handler(request: Request): Promise<Response> {
  const headers = { 'Content-Type': 'application/json' };
  try {
    if (request.method === 'GET') {
      const members = await kv.get(MEMBERS_KEY);
      return new Response(JSON.stringify({ members: members || [] }), { status: 200, headers });

    } else if (request.method === 'POST') {
      const { members } = await request.json() as { members: Omit<Member, 'hackathonName'>[] };

      if (!Array.isArray(members)) {
        return new Response(JSON.stringify({ error: 'Invalid data format. "members" should be an array.' }), { status: 400, headers });
      }

      const newMembers: Member[] = members.map(memberData => ({
        ...memberData,
        hackathonName: 'Glitch 1.0',
      }));

      await kv.set(MEMBERS_KEY, newMembers);
      return new Response(JSON.stringify({ message: 'Data saved successfully.' }), { status: 200, headers });

    } else if (request.method === 'DELETE') {
      await kv.del(MEMBERS_KEY);
      return new Response(JSON.stringify({ message: 'All data cleared.' }), { status: 200, headers });

    } else {
      const allowHeaders = { 'Allow': 'GET, POST, DELETE' };
      return new Response(`Method ${request.method} Not Allowed`, { status: 405, headers: allowHeaders });
    }
  } catch (error) {
    console.error('API Error:', error);
    return new Response(JSON.stringify({ error: 'An internal server error occurred.' }), { status: 500, headers });
  }
}