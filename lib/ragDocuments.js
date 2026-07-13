// Self-referential by design: the knowledge base is about local AI concepts,
// so students can ask this RAG demo to explain the very ideas the course
// covers and watch retrieval pull the right paragraph before it answers.

export const DOCUMENTS = [
  "LM Studio is a desktop app for running large language models entirely " +
    "on your own computer. It provides a local server with an OpenAI-compatible " +
    "API, so existing OpenAI client code works against it with just a different base_url.",

  "Quantization shrinks a model's file size and memory footprint by storing its " +
    "weights with fewer bits of precision. A Q4_0 quantized model uses roughly 4 bits " +
    "per weight instead of 16 or 32, trading a small amount of accuracy for a much " +
    "smaller download and faster inference on consumer hardware.",

  "GGUF is a file format designed for running quantized models efficiently on CPUs " +
    "and consumer GPUs. It packages the model weights, tokenizer, and metadata into a " +
    "single file that tools like LM Studio and llama.cpp can load directly.",

  "A context window is the maximum amount of text, measured in tokens, that a model " +
    "can consider at once when generating a response. Anything outside the context " +
    "window is invisible to the model during that request.",

  "Embeddings are numerical vectors that represent the meaning of a piece of text. " +
    "Texts with similar meaning end up with vectors that are close together in vector " +
    "space, which makes it possible to search by meaning rather than by exact keywords.",

  "Retrieval-Augmented Generation, or RAG, combines a retrieval step with a generation " +
    "step. Relevant chunks of text are found in a knowledge base, then inserted into " +
    "the prompt so the model can answer using that specific context instead of relying " +
    "only on what it learned during training.",

  "Tool calling, also called function calling, lets a model request that a specific " +
    "function be run on its behalf, such as fetching live data or performing a " +
    "calculation. The model doesn't execute the function itself — it returns a " +
    "structured request, and the calling code runs the real function and returns the result.",

  "Temperature controls how random a model's output is. A low temperature such as 0.2 " +
    "makes responses more focused and repeatable, while a high temperature such as 1.0 " +
    "produces more varied and creative output.",

  "A system prompt is an instruction given to a model before the conversation starts, " +
    "setting its role, tone, or constraints. It typically carries more weight than later " +
    "user messages and stays in effect for the whole conversation.",

  "TF-IDF is a classic, non-neural way to score how relevant a document is to a query. " +
    "It weighs words that are frequent in a document but rare across the whole " +
    "collection more heavily, so common words like 'the' contribute far less than " +
    "distinctive words like 'quantization'.",

  "Parameters are the numerical values—like weights and biases—that a neural " +
    "network learns during training. Acting like millions of tiny internal \"dials,\" " +
    "they determine how the model transforms an input into an output, collectively " +
    "encoding its knowledge, language patterns, reasoning and skills. " +
    " The number of parameters is often used as a rough measure of a model's " + 
    "size and capability.",
];
