# ADR 0002: Specialized RAG Processing by Document Type (QA Focus)

* **Status**: Proposed
* **Date**: 2026-02-12
* **Deciders**: Jérémie

---

### 1. Context and Problem Statement
We are initiating the development of our RAG (Retrieval-Augmented Generation) pipeline. Instead of building a generic system that attempts to handle all document types poorly, we need a focused starting point that provides immediate high-value results.

### 2. Decision
We decided to build the initial RAG pipeline specifically optimized for **QA (Question & Answer)** document types before supporting generic text.

* **User-Driven Classification**: During the upload, users must explicitly select the "QA" type.
* **Atomic Chunking**: The system will treat each Question + Answer pair as a single "thunk" (vector entry). This ensures that the retrieval step always returns a complete answer to a given query.
* **Structured Storage**: Vectors will be stored with metadata identifying them as QA pairs to allow for highly precise similarity matching.

### 3. Alternatives Considered
* **Generic Text First**: Starting with standard PDF narrative text. Rejected because generic chunking often produces "noisy" results that are harder to tune for a V0.
* **Multi-format Support from Launch**: Rejected to avoid over-engineering and to speed up the time-to-market for the initial RAG capability.

### 4. Consequences
* **Positive Impacts**:
    * **Precision**: QA data is "pre-structured" for retrieval, leading to a much better user experience for the first version.
    * **Simplified Logic**: We avoid the complexities of recursive character splitting and overlapping windows by focusing on clear QA boundaries.
* **Negative Impacts / Risks**:
    * **Limited Use Case**: Users cannot yet upload long-form manuals or narrative documents effectively.
    * **Format Strictness**: We must enforce a specific format (e.g., CSV or structured Markdown) for the QA uploads to work correctly.

### 5. Implementation Notes
* This ADR marks the official start of the RAG engine.
* The first milestone is a parser capable of identifying "Question/Answer" pairs and embedding them as individual units.