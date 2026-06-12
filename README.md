# Event-Driven Video Transcription & Search Platform

A production-grade, cloud-native serverless application that automates video transcription using an event-driven asynchronous pipeline. This architecture handles high-latency AI workloads efficiently without blocking user interactions or freezing the frontend.

---

## System Architecture

The platform is designed around a decoupled, event-driven pattern ensuring fault tolerance and scalability:

```text
[ Next.js Frontend ] ➔ Presigned URL ➔ [ Amazon S3 Bucket ]
                                                │
                                         S3 Object Created
                                                ▼
[ Database (Neon/Postgres) ] ◄── Prisma ── [ AWS Lambda Worker ] ◄── [ Amazon SQS Queue ]
                                                │
                                        Whisper-3 Inference
                                                ▼
                                          [ Groq AI API ]
```

--- 

## The Ingress Lifecycle

Ingress: The client requests a Presigned URL from the backend API to upload a video asset directly to Amazon S3, optimizing network latency and removing file-size overhead from the web server.

De-coupling: Once the upload completes, S3 emits an object-created event notification straight to an Amazon SQS queue, acting as a durable message buffer.

Compute: An AWS Lambda worker processes incoming messages asynchronously, streaming the audio payload to Groq AI (Whisper-3) for rapid speech-to-text transformation.

Persistence: The execution status and full transcription text are committed securely via Prisma to a serverless PostgreSQL (Neon) cluster, instantly updating the user interface.

---

## Tech Stack

- **Frontend:** Next.js (App Router), React, Tailwind CSS

- **Backend Runtime:** Node.js, TypeScript

- **ORM:** Prisma 7 

- **Database:** PostgreSQL via Neon

- **Cloud Infrastructure:** AWS S3, AWS SQS, AWS Lambda

- **AI Processing Engine:** Groq API (OpenAI Whisper-3)

---

## Key Features Implemented

- **Optimistic UI Updates:** Provides immediate visual response upon asset upload, creating a snappy interface by reconciling client-side temporary state with database records upon server confirmation.

- **Live Polling Synchronization:** Periodically sweeps the remote database for real-time processing indicators, keeping the user interface completely in-sync with underlying cloud workers.

- **Full-Text Keyword Search:** Offers responsive, lightning-fast client-side querying over both video titles and transcript bodies.

---

## Project Structure

```text
├── app/
│   ├── api/
│   │   └── upload/
│   │       └── route.ts         # Handles presigned URL generation & initial DB records
│   ├── dashboard/
│   │   └── Dashboard.tsx        # Responsive video dashboard & search view
│   └── layout.tsx
├── lambda/
│   └── index.ts                 # AWS Lambda handler script for processing SQS events
├── prisma/
│   ├── prisma.config.ts         # Prisma 7 decoupling configuration
│   └── schema.prisma            # Relational database schemas
├── package.json
└── README.md
```

