import { Pinecone } from '@pinecone-database/pinecone';

const globalForPinecone = globalThis as unknown as {
  pinecone: Pinecone | undefined;
};

/**
 * Lazily initialise the Pinecone client so the module can be imported at
 * build-time (when env vars may not yet be available) without crashing.
 */
export function getPinecone(): Pinecone {
  if (globalForPinecone.pinecone) return globalForPinecone.pinecone;

  const apiKey = process.env.PINECONE_API_KEY;
  if (!apiKey) {
    throw new Error(
      'PINECONE_API_KEY is not set. Add it to your environment variables.',
    );
  }

  const client = new Pinecone({ apiKey });

  if (process.env.NODE_ENV !== 'production') {
    globalForPinecone.pinecone = client;
  }

  return client;
}

export const PINECONE_INDEX =
  process.env.PINECONE_INDEX_NAME ?? 'eventnest-vendors';
