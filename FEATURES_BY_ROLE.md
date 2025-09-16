# PromoPlan Pro: Features by User Role

This document outlines the specific features, capabilities, and access levels for each user role within the PromoPlan Pro application.

---

## 1. Commercial (`commercial`)

This role is responsible for the initial creation and management of marketing campaigns.

### Core Capabilities:
- **Campaign Creation**:
  - Create new promotional campaigns from a blank form.
  - **Trade Letter AI Scanner**: Upload a trade letter document (PDF or image) to automatically pre-fill campaign details using AI.
  - Save campaigns as a **Draft** to complete later.
  - Submit campaigns to the ShopOps team for review.

- **Campaign Management**:
  - View a personalized dashboard showing all campaigns they have created.
  - Edit campaigns that are in `Draft` or `Returned` status.
  - Delete their own campaigns (a confirmation is required).
  - View the status and details of all their submitted campaigns.

- **Filtering & Searching**:
  - Filter their campaign list by status, platform, brand, and date range.
  - Search for specific campaigns.

- **SRP Masterlist**:
  - View the complete SRP Masterlist.
  - Add, edit, and delete items from the masterlist.

- **Navigation**:
  - Access to `Dashboard`, `New Campaign`, and `SRP Masterlist` pages.

---

## 2. ShopOps (`shop-ops`)

This role is responsible for the validation, execution, and operational management of submitted campaigns.

### Core Capabilities:
- **Operational Dashboard**:
  - View a dedicated dashboard showing only campaigns relevant to their workflow (`Submitted`, `Validated`, `Active`, `Completed`).
  - Cannot see campaigns in `Draft` status.

- **Campaign Processing**:
  - **Validate Campaigns**: Review `Submitted` campaigns and validate them, changing their status to `Validated`.
  - Update the status of a campaign as it moves through the operational lifecycle (e.g., from `Validated` to `Active`).
  - **Return Campaigns**: If a campaign has operational issues (e.g., incorrect SKU), they can return it to the Commercial team with remarks. The campaign status changes to `Returned`.

- **Data Export**:
  - Select one or more campaigns from their dashboard.
  - Export all details of the selected campaigns (including product-level promotion data) to a **CSV file** for external use.

- **SRP Masterlist**:
  - View the SRP Masterlist (read-only access).

- **Navigation**:
  - Access to the `ShopOps` dashboard and `SRP Masterlist` pages. They are directed to their specific dashboard upon login.

---

## 3. Finance (`finance`)

This role has read-only access across the system for auditing, financial tracking, and reporting purposes.

### Core Capabilities:
- **Global View**:
  - View all campaigns from all teams and statuses in a single, comprehensive dashboard.
  - Access provides a complete overview of all promotional activities for financial analysis.

- **Read-Only Access**:
  - Can view the full details of any campaign but **cannot** create, edit, approve, delete, or change the status of any campaign.
  - All interactive elements (buttons, input fields) are disabled for this role.

- **Filtering & Searching**:
  - Can filter the global campaign list by status, platform, brand, and date range to find specific information.

- **SRP Masterlist**:
  - View the SRP Masterlist (read-only access).

- **Navigation**:
  - Access to the main `Dashboard` and `SRP Masterlist` pages.
