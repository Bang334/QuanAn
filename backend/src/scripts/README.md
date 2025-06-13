# Database Migration Scripts

This directory contains database migration scripts for manual execution.

## Available Scripts

### remove-allowed-categories.js

This script removes the `allowedCategories` column from the `kitchen_permissions` table and updates the comment on the `canAutoApprove` column to reflect its new dual purpose (both for approving orders and adding ingredients).

#### How to Run

From the project root directory:

```bash
node backend/src/scripts/remove-allowed-categories.js
```

#### What it Does

1. Checks if the `allowedCategories` column exists in the `kitchen_permissions` table
2. Updates the comment on the `canAutoApprove` column to reflect its new purpose
3. Drops the `allowedCategories` column if it exists
4. Logs the results of the operation

#### Important Notes

- Make sure to back up your database before running this script
- This is a one-way operation and cannot be undone automatically
- The script will automatically close the database connection when finished 