# PromoPlan Pro: User Stories

This document outlines the core features of the PromoPlan Pro application from the perspective of its users.

---

## Epic: User Authentication & Access Control

- **As a user**, I want to log in to the system with my credentials **so that** I can access features specific to my role.
- **As a Commercial user**, I want to be redirected to the main dashboard after login **so that** I can see an overview of my campaigns.
- **As a ShopOps user**, I want to be redirected to the ShopOps dashboard after login **so that** I can manage my operational tasks.
- **As a Finance user**, I want to be redirected to the main dashboard after login **so that** I can get a global view of all promotional activities.
- **As a user**, I want to log out of the system **so that** I can secure my session.

## Epic: Campaign Creation & Management (Commercial Role)

- **As a Commercial user**, I want to create a new campaign from a form **so that** I can define all the necessary details for a promotion.
- **As a Commercial user**, I want to upload a trade letter **so that** the automated PWP campaign tool can extract all campaign details, reducing manual data entry and minimizing the risk of human error.
- **As a Commercial user**, I want to save a campaign as a "Draft" **so that** I can complete it later without losing my work.
- **As a Commercial user**, I want to submit a completed campaign to the ShopOps team **so that** it can be reviewed and validated.
- **As a Commercial user**, I want to view a dashboard of all the campaigns I have created **so that** I can track their status and progress.
- **As a Commercial user**, I want to edit campaigns that are in "Draft" or "Returned" status **so that** I can make corrections or updates based on feedback.
- **As a Commercial user**, I want to delete campaigns I created **so that** I can remove irrelevant or incorrect entries.
- **As a Commercial user**, I want to filter and search my campaign list by status, type, brand, and date **so that** I can quickly find specific campaigns.

## Epic: ShopOps Workflow

- **As a ShopOps user**, I want to view a dashboard of all campaigns relevant to my workflow (`Submitted`, `Validated`, `Active`, `Completed`) **so that** I can manage operations effectively.
- **As a ShopOps user**, I want to validate a submitted campaign **so that** it can proceed to be activated.
- **As a ShopOps user**, I want to update the status of a campaign (e.g., from `Validated` to `Active`) **so that** the campaign status accurately reflects its real-world progress.
- **As a ShopOps user**, I want to return a campaign to the Commercial team with remarks **so that** I can flag operational issues for correction.
- **As a ShopOps user**, I want to select multiple campaigns and export their details to a CSV file **so that** I can use the data for external processing or reporting.

## Epic: Finance & Auditing

- **As a Finance user**, I want to view a global dashboard of all campaigns across all statuses and teams **so that** I have a complete overview for financial auditing and analysis.
- **As a Finance user**, I want to have read-only access to all campaign details **so that** I can view information without accidentally modifying it.
- **As a Finance user**, I want to filter and search the global campaign list **so that** I can find specific data for my reports.

## Epic: SRP Masterlist Management

- **As a Commercial user**, I want to view, add, edit, and delete items in the SRP Masterlist **so that** I can manage the single source of truth for product pricing.
- **As a ShopOps user**, I want to view the SRP Masterlist in read-only mode **so that** I can reference correct pricing information for campaign execution.
- **As a Finance user**, I want to view the SRP Masterlist in read-only mode **so that** I can use it for financial analysis and auditing.
