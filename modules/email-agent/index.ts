// =========================================================================
// MODULE: AI EMAIL AGENT
// Standalone, self-contained module for drafting, planning, evaluating,
// and autonomously executing multi-week behavioral email campaigns.
// =========================================================================

export * from "./types";
export * from "./constants";

// Core Engine
export { draftSingleEmail, draftSequence, callAI } from "./core/drafter";
export { runAutonomousSequenceTick } from "./core/sequence-planner";
export { evaluateSubscriberBehavior, adaptSubjectForSegment } from "./core/evaluator";
export { sendEmailDirectly, enqueueAutonomousStepJob, getMailTransporter } from "./core/dispatcher";

// Storage
export * from "./storage/agent-store";

// Handlers for API endpoints
export { handleGenerateRequest } from "./api/generate-handler";
export { handleGetCampaign, handleCreateCampaign } from "./api/campaign-handler";
export { handleActionRequest } from "./api/action-handler";
export { handleCronTick } from "./api/cron-handler";

// UI Components
export { EmailAgentApp } from "./ui/EmailAgentApp";
