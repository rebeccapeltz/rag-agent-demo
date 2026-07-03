// A small, dependency-free TF-IDF retriever.
//
// This trades semantic understanding (what sentence-transformers gives you)
// for something that runs anywhere with zero downloads and zero extra API
// calls — a fair trade for a teaching demo, and worth naming explicitly
// when you present this: it matches on shared vocabulary, not meaning, so
// a question that rephrases every word differently from the source text
// will retrieve worse than the local sentence-transformers version did.

function tokenize(text) {
  return text.toLowerCase().match(/[a-z0-9]+/g) || [];
}

function termFrequencies(tokens) {
  const counts = new Map();
  for (const t of tokens) counts.set(t, (counts.get(t) || 0) + 1);
  const total = tokens.length || 1;
  const tf = new Map();
  for (const [term, count] of counts) tf.set(term, count / total);
  return tf;
}

function inverseDocFrequency(term, documentFrequency, numDocs) {
  const df = documentFrequency.get(term) || 0;
  // Smoothed IDF so unseen terms don't produce a divide-by-zero or a
  // wildly dominant score.
  return Math.log((numDocs + 1) / (df + 1)) + 1;
}

function vectorize(tokens, documentFrequency, numDocs) {
  const tf = termFrequencies(tokens);
  const vector = new Map();
  for (const [term, tfValue] of tf) {
    vector.set(term, tfValue * inverseDocFrequency(term, documentFrequency, numDocs));
  }
  return vector;
}

function cosineSimilarity(vectorA, vectorB) {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (const [term, value] of vectorA) {
    normA += value * value;
    if (vectorB.has(term)) dot += value * vectorB.get(term);
  }
  for (const value of vectorB.values()) normB += value * value;
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Call once at server startup (or module load) — reused across requests.
export function buildIndex(documents) {
  const documentFrequency = new Map();
  const tokenizedDocs = documents.map(tokenize);

  for (const tokens of tokenizedDocs) {
    const uniqueTerms = new Set(tokens);
    for (const term of uniqueTerms) {
      documentFrequency.set(term, (documentFrequency.get(term) || 0) + 1);
    }
  }

  const numDocs = documents.length;
  const docVectors = tokenizedDocs.map((tokens) =>
    vectorize(tokens, documentFrequency, numDocs)
  );

  return { docVectors, documentFrequency, numDocs };
}

export function retrieve(query, documents, index, topK = 3) {
  const queryVector = vectorize(tokenize(query), index.documentFrequency, index.numDocs);

  const scored = index.docVectors.map((docVector, i) => ({
    text: documents[i],
    score: cosineSimilarity(queryVector, docVector),
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}
