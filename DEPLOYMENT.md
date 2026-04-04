# Deployment Guide - Matrimony Platform

## Architecture

| Layer | Tech | AWS Service |
|---|---|---|
| Frontend | React + Vite + Tailwind | S3 + CloudFront |
| API | 36 routes | API Gateway HTTP (v2) |
| Backend | 9 Lambda functions | Lambda (Node.js 20) |
| Database | Single-table design | DynamoDB (4 tables) |
| Auth | Phone OTP | Cognito |
| Email | Transactional | SES |
| SMS | OTP delivery | SNS |
| Payments | Stripe Checkout | Stripe API |
| CDN | Static + Media | CloudFront (2 distributions) |
| IaC | Terraform | S3 backend + DynamoDB locks |
| CI/CD | GitHub Actions | OIDC role assumption |

---

## What Code Does vs What You Do Manually

### Already done in code (no action needed)

- 9 Lambda `index.ts` routers that dispatch API Gateway routes to handlers
- `scripts/package-lambdas.sh` builds + ZIPs all 9 services
- Terraform `filename` + `source_code_hash` wired for all Lambda modules (stage + prod)
- GitHub Actions workflows package Lambdas, deploy infra, deploy frontend
- Seed scripts support `dev` / `stage` / `prod` environment argument
- `.gitignore` excludes `*.tfvars`, `infra/lambda-packages/`

### You need to do manually (one-time setup)

1. Create AWS account + configure CLI
2. Create Terraform state backend (S3 bucket + DynamoDB table)
3. Get SSL certificate from ACM
4. Register domain + configure DNS
5. Create Stripe account + get API keys
6. Set up GitHub OIDC + secrets
7. Seed subscription plans after first deploy

---

## Pre-requisites

### Tools

| Tool | Version | Install |
|---|---|---|
| Node.js | >= 20 | https://nodejs.org |
| pnpm | >= 9 | `npm install -g pnpm` |
| Terraform | >= 1.6 | https://terraform.io |
| AWS CLI | v2 | https://aws.amazon.com/cli |

### AWS Account

```bash
aws configure
# Access Key ID: YOUR_KEY
# Secret Access Key: YOUR_SECRET
# Region: ap-south-1
```

### Stripe Account

Get these from Stripe Dashboard > Developers > API Keys:
- Secret Key: `sk_test_...` (stage) / `sk_live_...` (prod)
- Publishable Key: `pk_test_...` (frontend)
- Webhook Secret: `whsec_...` (created in Step 10)

---

## Deployment Steps

### Step 1: Create Terraform State Backend

Run these once — they create the S3 bucket and DynamoDB table Terraform needs to store its state:

```bash
aws s3api create-bucket \
  --bucket matrimony-terraform-state \
  --region ap-south-1 \
  --create-bucket-configuration LocationConstraint=ap-south-1

aws s3api put-bucket-versioning \
  --bucket matrimony-terraform-state \
  --versioning-configuration Status=Enabled

aws dynamodb create-table \
  --table-name matrimony-terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region ap-south-1
```

### Step 2: Get SSL Certificate

CloudFront requires a certificate in **us-east-1**:

```bash
aws acm request-certificate \
  --domain-name YOUR-DOMAIN.com \
  --subject-alternative-names "*.YOUR-DOMAIN.com" \
  --validation-method DNS \
  --region us-east-1
```

Then:
1. Go to AWS Console > ACM > us-east-1
2. Add the CNAME validation records to your DNS
3. Wait for status "Issued" (5-30 min)
4. Copy the Certificate ARN

### Step 3: Create terraform.tfvars

Create in **each** environment folder. Never commit this file.

```hcl
# infra/environments/stage/terraform.tfvars
stripe_secret_key     = "sk_test_..."
stripe_webhook_secret = "whsec_..."
certificate_arn       = "arn:aws:acm:us-east-1:ACCOUNT:certificate/ID"
alarm_email           = "alerts@youremail.com"
```

```hcl
# infra/environments/prod/terraform.tfvars
stripe_secret_key     = "sk_live_..."
stripe_webhook_secret = "whsec_..."
certificate_arn       = "arn:aws:acm:us-east-1:ACCOUNT:certificate/ID"
alarm_email           = "alerts@youremail.com"
```

### Step 4: Package Lambda Functions

```bash
pnpm install
bash scripts/package-lambdas.sh
```

This builds the TypeScript, then creates 9 ZIP files in `infra/lambda-packages/`:
```
health.zip, auth.zip, profile.zip, uploads.zip, discovery.zip,
interests.zip, chat.zip, subscriptions.zip, safety.zip
```

### Step 5: Deploy Infrastructure

```bash
cd infra/environments/stage
terraform init
terraform plan        # review what will be created
terraform apply       # creates ~50+ AWS resources
```

This creates: 4 DynamoDB tables, 2 S3 buckets, API Gateway + 36 routes, 9 Lambda functions, 2 CloudFront distributions, Cognito User Pool, SES, SNS, CloudWatch alarms.

### Step 6: Note Terraform Outputs

```bash
terraform output
```

Save these values — you need them for frontend build and DNS:
```
api_endpoint               = "https://abc123.execute-api.ap-south-1.amazonaws.com"
frontend_bucket            = "matrimony-stage-frontend"
cognito_user_pool_id       = "ap-south-1_AbCdEfG"
cognito_client_id          = "1abc2def3ghi4jkl"
cloudfront_distribution_id = "E1A2B3C4D5E6F7"
cloudfront_domain          = "d1234abcdef.cloudfront.net"
```

### Step 7: Build and Deploy Frontend

```bash
cd web

VITE_API_BASE_URL=https://abc123.execute-api.ap-south-1.amazonaws.com \
pnpm run build

# Upload to S3
aws s3 sync dist/ s3://matrimony-stage-frontend --delete

# Clear CDN cache
aws cloudfront create-invalidation \
  --distribution-id E1A2B3C4D5E6F7 \
  --paths "/*"
```

### Step 8: Seed Subscription Plans

```bash
# REQUIRED — the app won't work without plan entitlements
pnpm seed:plans -- stage

# OPTIONAL — seed 15 demo profiles for testing
pnpm seed:profiles -- stage
```

### Step 9: Configure DNS

Point your domain to the CloudFront distributions:

| Record | Type | Value |
|---|---|---|
| `yourdomain.com` | A (Alias) or CNAME | CloudFront frontend domain |
| `www.yourdomain.com` | CNAME | CloudFront frontend domain |
| `media.yourdomain.com` | CNAME | CloudFront media domain |

### Step 10: Set Up Stripe Webhook

1. Go to Stripe Dashboard > Developers > Webhooks
2. Add endpoint: `https://YOUR-API-URL/subscriptions/webhook`
3. Select events: `checkout.session.completed`, `invoice.paid`, `customer.subscription.updated`, `customer.subscription.deleted`
4. Copy the signing secret (`whsec_...`) — update your `terraform.tfvars` and run `terraform apply` again

### Step 11: Verify SES Domain

SES starts in sandbox mode. You must verify your domain and request production access:

```bash
aws ses verify-domain-identity --domain yourdomain.com --region ap-south-1
```

Add the TXT record to your DNS, then request production access in AWS Console > SES.

### Step 12: Test

```bash
# Health check
curl https://YOUR-API-URL/health

# Open the site
open https://yourdomain.com
```

Test the full flow: register > create profile > discover > send interest > chat.

---

## Deploy to Production

Same steps but with `infra/environments/prod`:

```bash
bash scripts/package-lambdas.sh
cd infra/environments/prod
terraform init
terraform plan
terraform apply
```

Use `sk_live_...` Stripe keys and your real domain.

---

## CI/CD (GitHub Actions)

After the first manual deploy, CI/CD handles future deployments automatically.

### GitHub Secrets to Configure

Go to GitHub > Settings > Secrets and Variables > Actions:

**Per-environment secrets** (create `stage` and `production` environments):

| Secret | Value |
|---|---|
| `AWS_ROLE_ARN` | IAM OIDC role ARN |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret |
| `CERTIFICATE_ARN` | ACM certificate ARN |

**Per-environment variables:**

| Variable | Value |
|---|---|
| `API_BASE_URL` | API Gateway endpoint URL |
| `CLOUDFRONT_DIST_ID` | CloudFront distribution ID |
| `ALARM_EMAIL` | Alert notification email |

### GitHub OIDC Setup (no AWS keys in GitHub)

1. AWS Console > IAM > Identity Providers > Add Provider
2. Type: OpenID Connect
3. URL: `https://token.actions.githubusercontent.com`
4. Audience: `sts.amazonaws.com`
5. Create IAM Role that trusts this provider (with deploy permissions)
6. Add role ARN as `AWS_ROLE_ARN` secret

### How Deployments Work

| Trigger | What happens |
|---|---|
| PR to main/develop | CI runs: lint, typecheck, test, build, terraform validate |
| Push to `develop` | Auto-deploy to **stage** |
| Manual trigger on `main` | Deploy to **production** (type "deploy" to confirm) |

CI/CD automatically: builds frontend + backend, packages 9 Lambda ZIPs, runs `terraform apply`, uploads frontend to S3, invalidates CloudFront.

---

## Updating Plans Later

Edit the plans array in `scripts/seed-plans.ts`, then re-run:

```bash
pnpm seed:plans -- prod
```

DynamoDB `PutItem` overwrites existing records, so it's safe to re-run anytime.

---

## Useful Commands

```bash
# Package Lambdas
bash scripts/package-lambdas.sh

# Deploy infra
cd infra/environments/stage && terraform apply

# Deploy frontend
aws s3 sync web/dist/ s3://matrimony-stage-frontend --delete

# Update a single Lambda manually
aws lambda update-function-code \
  --function-name matrimony-stage-auth \
  --zip-file fileb://infra/lambda-packages/auth.zip

# View Lambda logs
aws logs tail /aws/lambda/matrimony-stage-auth --follow

# Invalidate CDN
aws cloudfront create-invalidation --distribution-id DIST_ID --paths "/*"

# Seed plans
pnpm seed:plans -- stage

# Health check
curl https://YOUR-API-URL/health
```

---

## Cost Estimate

### Stage (Low Traffic)

| Service | Monthly |
|---|---|
| DynamoDB (on-demand) | $0-5 |
| Lambda (1M free requests) | $0 |
| API Gateway | $0-1 |
| S3 | $0-1 |
| CloudFront (1TB free) | $0-1 |
| Cognito (50K MAU free) | $0 |
| SES | $0-1 |
| CloudWatch | $0-2 |
| **Total** | **~$1-10/month** |

### Production (~10K users)

| Service | Monthly |
|---|---|
| DynamoDB | $10-30 |
| Lambda | $5-15 |
| API Gateway | $3-10 |
| S3 + CloudFront | $7-25 |
| SNS SMS (OTPs) | $10-50 |
| SES | $1-5 |
| CloudWatch | $5-10 |
| **Total** | **~$40-150/month** |

---

## Deployment Checklist

### One-Time Setup
- [ ] AWS account + CLI configured
- [ ] Terraform state backend created (S3 + DynamoDB)
- [ ] ACM certificate issued in us-east-1
- [ ] Domain registered
- [ ] Stripe account + API keys
- [ ] GitHub OIDC + secrets configured

### Per Deploy
- [ ] `terraform.tfvars` created
- [ ] `bash scripts/package-lambdas.sh` run
- [ ] `terraform apply` successful
- [ ] Frontend built + uploaded to S3
- [ ] CloudFront invalidated
- [ ] `pnpm seed:plans -- <env>` run
- [ ] DNS records pointing to CloudFront
- [ ] SES domain verified
- [ ] Stripe webhook configured
- [ ] `curl API_URL/health` returns OK
- [ ] Full user flow tested
