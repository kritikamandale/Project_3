import { getPinecone, PINECONE_INDEX } from './client';
import type { RecordMetadataValue } from '@pinecone-database/pinecone';
import type { Vendor } from '@/types/vendor.types';

interface VendorMetadata {
  vendorId:  string;
  category:  string;
  city:      string;
  rating:    number;
  priceFrom: number;
  [key: string]: RecordMetadataValue;
}

function vendorToText(vendor: Vendor): string {
  const price = vendor.priceMin ? `Starting from ₹${vendor.priceMin}` : '';
  const parts = [
    vendor.businessName,
    vendor.category,
    vendor.city,
    vendor.state,
    vendor.description ?? '',
    (vendor.tags ?? []).join(', '),
    price,
  ];
  return parts.filter(Boolean).join('. ');
}

export async function upsertVendorEmbedding(vendor: Vendor): Promise<void> {
  try {
    const pc    = getPinecone();
    const index = pc.index<VendorMetadata>(PINECONE_INDEX);
    const text  = vendorToText(vendor);

    const result = await pc.inference.embed({
      model:      'multilingual-e5-large',
      inputs:     [text],
      parameters: { inputType: 'passage', truncate: 'END' },
    });

    const embedding = result.data[0];
    const vector    = embedding?.vectorType === 'dense' ? (embedding as { values: number[]; vectorType: string }).values : null;
    if (!vector) return;

    await index.upsert({
      records: [
        {
          id:     vendor.id,
          values: vector,
          metadata: {
            vendorId:  vendor.id,
            category:  vendor.category,
            city:      vendor.city,
            rating:    vendor.rating ?? 0,
            priceFrom: vendor.priceMin ?? 0,
          },
        },
      ],
    });
  } catch (err) {
    console.error('[Pinecone] upsertVendorEmbedding failed:', err);
  }
}

export async function searchSimilarVendors(
  query: string,
  filters?: { category?: string; city?: string; minRating?: number },
): Promise<string[]> {
  try {
    const pc    = getPinecone();
    const index = pc.index<VendorMetadata>(PINECONE_INDEX);

    const result = await pc.inference.embed({
      model:      'multilingual-e5-large',
      inputs:     [query],
      parameters: { inputType: 'query', truncate: 'END' },
    });

    const embedding = result.data[0];
    const vector    = embedding?.vectorType === 'dense' ? (embedding as { values: number[]; vectorType: string }).values : null;
    if (!vector) return [];

    const pineconeFilter: Record<string, unknown> = {};
    if (filters?.category)  pineconeFilter.category = { $eq: filters.category };
    if (filters?.city)      pineconeFilter.city      = { $eq: filters.city };
    if (filters?.minRating) pineconeFilter.rating    = { $gte: filters.minRating };

    const results = await index.query({
      vector,
      topK:            10,
      filter:          Object.keys(pineconeFilter).length ? pineconeFilter : undefined,
      includeMetadata: true,
    });

    return results.matches.map((m) => m.id);
  } catch (err) {
    console.error('[Pinecone] searchSimilarVendors failed:', err);
    return [];
  }
}
