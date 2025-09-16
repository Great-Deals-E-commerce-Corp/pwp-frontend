# PromoPlan Pro: Business Requirements Document (BRD)

**Project:** PromoPlan Pro
**Version:** 1.0
**Date:** 2024-06-28

---

## 1. Introduction

### 1.1. Project Overview

PromoPlan Pro is an enterprise web application designed to digitize and streamline the end-to-end workflow for creating, approving, executing, and auditing promotional campaigns. By leveraging an automated PWP campaign tool for data extraction and providing role-specific dashboards, the application serves as a central collaboration hub for the Commercial, Shop Operations (ShopOps), and Finance teams.

### 1.2. Purpose

The primary purpose of this document is to define the scope, requirements, and objectives of the PromoPlan Pro application. It serves as the foundational agreement between stakeholders on what the system will deliver.

### 1.3. Scope

The scope of this project includes the development and implementation of all features related to user authentication, campaign lifecycle management (creation, submission, execution), data export, AI-powered data entry, and master data management (SRP Masterlist).

---

## 2. Business Requirements

This section outlines the high-level business goals and objectives that the project aims to achieve.

| ID      | Requirement                                                                      | Rationale                                                                                             |
| :------ | :------------------------------------------------------------------------------- | :---------------------------------------------------------------------------------------------------- |
| **BR-01** | **Reduce Manual Data Entry & Errors**                                            | Automate the extraction of campaign details from trade letters using an automated PWP campaign tool to minimize human error and save time. |
| **BR-02** | **Accelerate Campaign Time-to-Market**                                           | Streamline the submission and execution process through a standardized digital workflow, reducing delays.        |
| **BR-03** | **Establish a Single Source of Truth**                                           | Create a centralized platform where all teams can access consistent and up-to-date campaign information.    |
| **BR-04** | **Enhance Visibility & Auditing**                                                | Provide comprehensive, read-only access for management and finance teams to monitor and audit all promotional activities. |
| **BR-05** | **Standardize Product Pricing Management**                                       | Maintain a central, authoritative masterlist for Suggested Retail Prices (SRP) to ensure pricing consistency. |

---

## 3. User Stories

This section details the system's functionalities from the perspective of its end-users, organized by feature epic.

### 3.1. Epic: User Authentication & Access Control

-   **As a user**, I want to log in to the system with my credentials **so that** I can access features specific to my role.
-   **As a Commercial user**, I want to be redirected to the main dashboard after login **so that** I can see an overview of my campaigns.
-   **As a ShopOps user**, I want to be redirected to the ShopOps dashboard after login **so that** I can manage my operational tasks.
-   **As a Finance user**, I want to be redirected to the main dashboard after login **so that** I can get a global view of all promotional activities.
-   **As a user**, I want to log out of the system **so that** I can secure my session.

### 3.2. Epic: Campaign Creation & Management (Commercial Role)

-   **As a Commercial user**, I want to create a new campaign from a form **so that** I can define all the necessary details for a promotion.
-   **As a Commercial user**, I want to upload a trade letter **so that** the automated PWP campaign tool can extract all campaign details, reducing manual data entry and minimizing the risk of human error.
-   **As a Commercial user**, I want to save a campaign as a "Draft" **so that** I can complete it later without losing my work.
-   **As a Commercial user**, I want to submit a completed campaign to the ShopOps team **so that** it can be reviewed and validated.
-   **As a Commercial user**, I want to view a dashboard of all the campaigns I have created **so that** I can track their status and progress.
-   **As a Commercial user**, I want to edit campaigns that are in "Draft" or "Returned" status **so that** I can make corrections or updates based on feedback.
-   **As a Commercial user**, I want to delete campaigns I created **so that** I can remove irrelevant or incorrect entries.
-   **As a Commercial user**, I want to filter and search my campaign list by status, type, brand, and date **so that** I can quickly find specific campaigns.

### 3.3. Epic: ShopOps Workflow

-   **As a ShopOps user**, I want to view a dashboard of all campaigns relevant to my workflow (`Submitted`, `Validated`, `Active`, `Completed`) **so that** I can manage operations effectively.
-   **As a ShopOps user**, I want to validate a submitted campaign **so that** it can proceed to be activated.
-   **As a ShopOps user**, I want to update the status of a campaign (e.g., from `Validated` to `Active`) **so that** the campaign status accurately reflects its real-world progress.
-   **As a ShopOps user**, I want to return a campaign to the Commercial team with remarks **so that** I can flag operational issues for correction.
-   **As a ShopOps user**, I want to select multiple campaigns and export their details to a CSV file **so that** I can use the data for external processing or reporting.

### 3.4. Epic: Finance & Auditing

-   **As a Finance user**, I want to view a global dashboard of all campaigns across all statuses and teams **so that** I have a complete overview for financial auditing and analysis.
-   **As a Finance user**, I want to have read-only access to all campaign details **so that** I can view information without accidentally modifying it.
-   **As a Finance user**, I want to filter and search the global campaign list **so that** I can find specific data for my reports.

### 3.5. Epic: SRP Masterlist Management

-   **As a Commercial user**, I want to view, add, edit, and delete items in the SRP Masterlist **so that** I can manage the single source of truth for product pricing.
-   **As a ShopOps user**, I want to view the SRP Masterlist in read-only mode **so that** I can reference correct pricing information for campaign execution.
-   **As a Finance user**, I want to view the SRP Masterlist in read-only mode **so that** I can use it for financial analysis and auditing.

### 3.6. Epic: General System Requirements
-   **As a user**, I need the system to enforce role-based access **so that** I only see and interact with features relevant to my job.
-   **As a user**, I expect a secure logout function **so that** I can end my session safely.

---

## 4. Non-Functional Requirements

This section defines the quality attributes and constraints of the system.

| ID      | Category        | Requirement                                                                                                    |
| :------ | :-------------- | :------------------------------------------------------------------------------------------------------------- |
| **NFR-1** | **Usability**     | The user interface shall be intuitive, clean, and responsive, ensuring a consistent experience across modern web browsers. |
| **NFR-2** | **Performance**   | Page loads must be fast, utilizing server-side rendering. AI scanning processes should complete within a reasonable time and provide visual feedback (e.g., loaders). |
| **NFR-3** | **Reliability**   | The application must be highly available and handle data storage and synchronization robustly to prevent data loss or inconsistency. |
| **NFR-4** | **Security**      | The system must enforce strict role-based access control (RBAC) to prevent unauthorized access or actions. All user sessions must be authenticated. |
| **NFR-5** | **Maintainability**| The codebase shall be clean, well-organized, and adhere to the defined technology stack (Next.js, React, ShadCN UI, Tailwind CSS, Genkit). |
| **NFR-6** | **Styling**       | The application shall adhere to the defined style guide: Primary Color (#E64833), Background (#FBE9D0), Accent (#E64833), and 'Inter' font. |

---

## 5. Assumptions, Dependencies, and Constraints

This section outlines the key assumptions, external dependencies, and project constraints.

### 5.1. Assumptions
- **User Competency**: Users are assumed to have basic computer literacy and are familiar with navigating standard web applications.
- **Internet Connectivity**: Users will have a stable internet connection to access the application and its features, particularly the AI-powered scanner.
- **Trade Letter Quality**: The trade letters uploaded for AI scanning are assumed to be of reasonable quality (e.g., clear, machine-readable text in PDF or high-resolution image format).
- **Role Sufficiency**: The defined roles (`Commercial`, `ShopOps`, `Finance`) are sufficient for the initial launch and cover all necessary workflow permissions.

### 5.2. Dependencies
- **Technology Stack**: The application is dependent on the predefined technology stack: Next.js, React, ShadCN UI, Tailwind CSS, and Genkit.
- **Google AI Platform**: The "Trade Letter AI Scanner" is critically dependent on the availability and performance of Google's Gemini models, which are accessed via the Genkit SDK.
- **Modern Browsers**: The application relies on modern web browser features, including `localStorage`, and is intended for use on up-to-date versions of Chrome, Firefox, Safari, and Edge.

### 5.3. Constraints
- **Authentication System**: The current login system is a simplified role-selector for demonstration purposes. A production version would require integration with a secure, centralized identity management system.
- **Data Persistence**: The application uses the browser's `localStorage` for data storage. This means data is not shared between users or devices and is not suitable for a production environment. A production system would require a centralized database backend.
- **Scope**: The project scope is strictly limited to the features and requirements detailed in this document. Any new features will require a formal change request and a new scope definition.
- **File Format Limitations**: The AI scanner is optimized for PDFs and common image formats. Its performance may be degraded with low-quality scans, handwritten notes, or unsupported file types.
