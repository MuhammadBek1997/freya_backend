# Deployment Guide - Freya Backend

## Deployment Platforms

### 1. Vercel Deployment

1. **Database Setup:**
   - Create a PostgreSQL database on Neon, Supabase, or PlanetScale
   - Get the connection string

2. **Environment Variables:**
   ```
   NODE_ENV=production
   DATABASE_URL=your_postgresql_connection_string
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRES_IN=7d
   FRONTEND_URL=your_frontend_url
   CLICK_MERCHANT_ID=your_merchant_id
   CLICK_SERVICE_ID=your_service_id
   CLICK_SECRET_KEY=your_secret_key
   ESKIZ_EMAIL=test@eskiz.uz
   ESKIZ_PASSWORD=j6DWtQjjpLDNjWEk74Sx
   ESKIZ_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3NjEwNjY3NDYsImlhdCI6MTc1ODQ3NDc0Niwicm9sZSI6InVzZXIiLCJzaWduIjoiY2Y0MjBjNzQ5ODQ0NjhkMjVlMDI2ODkyNTI1NTZlZTgzZTc5OWUxMjIxMzFiMGNlYTBkYzAxZmE4MTIxMjRkMyIsInN1YiI6IjExOTE5In0.kufQYF5VAmLecgb9sA4Ej_NRtj4EHgiLK7WpniDYlL0
   ESKIZ_BASE_URL=https://notify.eskiz.uz/api
   ```

3. **Deploy:**
   ```bash
   vercel --prod
   ```

### 2. Railway Deployment

1. **Create Project:**
   - Connect your GitHub repository
   - Railway will auto-detect Node.js

2. **Add PostgreSQL:**
   - Add PostgreSQL service from Railway marketplace
   - Copy the DATABASE_URL

3. **Environment Variables:**
   - Set the same variables as Vercel
   - DATABASE_URL will be auto-provided by Railway

4. **Deploy:**
   - Push to main branch or deploy manually

### 3. Render Deployment

1. **Create Web Service:**
   - Connect GitHub repository
   - Use the render.yaml configuration

2. **Database:**
   - PostgreSQL database will be created automatically
   - Connection string will be injected

3. **Environment Variables:**
   - Most variables are configured in render.yaml
   - Add sensitive keys manually in dashboard

## Database Migration

Before deploying, make sure to run database migrations:

```sql
-- Create tables if they don't exist
-- Copy your local database schema to production
```

## Health Check Endpoint

All platforms use `/api/health` for health checks. Make sure this endpoint returns 200 OK.

## Common Issues

1. **Database Connection:** Make sure DATABASE_URL is correctly set
2. **CORS:** Frontend URL should be added to CORS configuration
3. **Environment Variables:** All required variables must be set
4. **Port Configuration:** Use process.env.PORT for dynamic port assignment

## Testing Deployment

After deployment, test these endpoints:
- GET /api/health
- GET /api-docs (Swagger documentation)
- POST /api/user/register/step1
- GET /api/salons