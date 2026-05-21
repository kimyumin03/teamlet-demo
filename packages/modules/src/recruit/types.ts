import type { JobPostingStatus, CandidateResult } from "@teamlet/db";

export type { JobPostingStatus, CandidateResult };

export type PostingListItem = {
  id: string;
  title: string;
  status: JobPostingStatus;
  managerName: string;
  candidateCount: number;
  createdAt: Date;
};

export type PostingDetail = {
  id: string;
  title: string;
  description: string;
  status: JobPostingStatus;
  managerName: string;
  createdAt: Date;
  stages: { id: string; order: number; name: string }[];
  candidates: CandidateListItem[];
};

export type CandidateListItem = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  currentStageName: string | null;
  result: CandidateResult;
  appliedAt: Date;
};

export type CreatePostingInput = {
  companyId: string;
  managerId: string;
  title: string;
  description?: string;
  stages: string[];
};

export type CreateCandidateInput = {
  postingId: string;
  managerId?: string;
  name: string;
  email: string;
  phone?: string;
};
