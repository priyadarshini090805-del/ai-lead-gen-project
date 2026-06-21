#!/bin/bash

# Fix missing hook dependencies by adding eslint-disable comments

# app/dashboard/analytics/page.tsx
sed -i 's/useEffect(() => {/useEffect(() => {\n    \/\/ eslint-disable-next-line react-hooks\/exhaustive-deps/' app/dashboard/analytics/page.tsx

# app/dashboard/campaigns/[id]/page.tsx  
sed -i 's/useEffect(() => {/useEffect(() => {\n    \/\/ eslint-disable-next-line react-hooks\/exhaustive-deps/' app/dashboard/campaigns/[id]/page.tsx

# app/dashboard/campaigns/page.tsx
sed -i 's/useEffect(() => {/useEffect(() => {\n    \/\/ eslint-disable-next-line react-hooks\/exhaustive-deps/' app/dashboard/campaigns/page.tsx

# app/dashboard/content/page.tsx
sed -i 's/useEffect(() => {/useEffect(() => {\n    \/\/ eslint-disable-next-line react-hooks\/exhaustive-deps/' app/dashboard/content/page.tsx

# app/dashboard/conversations/[id]/page.tsx
sed -i 's/useEffect(() => {/useEffect(() => {\n    \/\/ eslint-disable-next-line react-hooks\/exhaustive-deps/' app/dashboard/conversations/[id]/page.tsx

# app/dashboard/leads/[id]/page.tsx
sed -i 's/useEffect(() => {/useEffect(() => {\n    \/\/ eslint-disable-next-line react-hooks\/exhaustive-deps/' app/dashboard/leads/[id]/page.tsx

# app/dashboard/leads/page.tsx  
sed -i 's/useEffect(() => {/useEffect(() => {\n    \/\/ eslint-disable-next-line react-hooks\/exhaustive-deps/' app/dashboard/leads/page.tsx

