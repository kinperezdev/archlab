/**
 * Local embedding model — turns text into 384-dimension vectors, fully offline.
 *
 * Uses @huggingface/transformers (ONNX runtime) running in-process. The model
 * (all-MiniLM-L6-v2) downloads once to a local cache, then never touches the
 * network again. This keeps the brain's contents on-device, matching ArchLab's
 * "the brain never leaves localhost" guarantee.
 *
 * Vectors are mean-pooled and L2-normalized, so cosine similarity between two
 * vectors is just their dot product (see vectorStore.ts).
 */

import { pipeline, type FeatureExtractionPipeline } from '@huggingface/transformers';

/** Dimensionality of all-MiniLM-L6-v2 output vectors. */
export const EMBED_DIM = 384;

const MODEL_ID = 'Xenova/all-MiniLM-L6-v2';

// The pipeline is heavy to construct, so build it once and reuse the promise.
let extractorPromise: Promise<FeatureExtractionPipeline> | null = null;

function getExtractor(): Promise<FeatureExtractionPipeline> {
  if (!extractorPromise) {
    console.log('[RAG] loading local embedding model (first call may download)…');
    extractorPromise = pipeline('feature-extraction', MODEL_ID);
  }
  return extractorPromise;
}

/** Embed a batch of texts. Returns one number[] of length EMBED_DIM per input. */
export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const extractor = await getExtractor();
  const output = await extractor(texts, { pooling: 'mean', normalize: true });
  // output is a Tensor shaped [texts.length, EMBED_DIM]; tolist() gives nested arrays.
  return output.tolist() as number[][];
}

/** Embed a single text. */
export async function embedText(text: string): Promise<number[]> {
  const [vector] = await embedTexts([text]);
  return vector;
}
