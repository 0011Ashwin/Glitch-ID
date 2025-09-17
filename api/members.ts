import { kv } from '@vercel/kv';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { Member } from '../types';

const MEMBERS_KEY = 'members';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'GET') {
      const members = await kv.get(MEMBERS_KEY);
      res.status(200).json({ members: members || [] });

    } else if (req.method === 'POST') {
      const { members } = req.body as { members: Omit<Member, 'hackathonName'>[] };

      if (!Array.isArray(members)) {
        return res.status(400).json({ error: 'Invalid data format. "members" should be an array.' });
      }

      const newMembers: Member[] = members.map(memberData => ({
        ...memberData,
        hackathonName: 'Glitch 1.0',
      }));

      await kv.set(MEMBERS_KEY, newMembers);
      res.status(200).json({ message: 'Data saved successfully.' });

    } else if (req.method === 'DELETE') {
      await kv.del(MEMBERS_KEY);
      res.status(200).json({ message: 'All data cleared.' });

    } else {
      res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
    }
  } catch (error) {
    console.error('API Error:', error);
    res.status(500).json({ error: 'An internal server error occurred.' });
  }
}
