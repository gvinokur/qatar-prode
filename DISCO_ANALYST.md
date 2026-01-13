# Disco Analyst - API Documentation

## Overview

**Disco Analyst** is Indeed's internal tool for web scraping and feed management, designed to help analyze and create job feeds from various sources. It provides automated web scraping capabilities with AI-powered CSS selector extraction and comprehensive feed management features.

**Base URL**: `https://disco-analyst.sandbox.indeed.net`

## Core Functionality

Disco Analyst provides the following main capabilities:

### 1. Feed Creation & Management
- **Create new feeds** from company websites
- **Fix existing feeds** with updated selectors
- **Validate feed creation** using CSV uploads
- **AI-powered mapping** for automatic selector extraction

### 2. URL Processing
- **Bulk processing** of URLs from CSV files
- **Extract job listings** and details from websites
- **Download processed results** as CSV files
- **Real-time processing control** (start/stop)

### 3. Pipeline Execution
- **Execute custom pipelines** with YAML configuration
- **Multi-step data processing** workflows
- **Track execution status** and download results
- **Configurable processing steps**

### 4. Intelligent Mapping
- **AI-powered CSS selector extraction** using LLM
- **Automatic job list delimiter detection**
- **Job details extraction** from individual job pages
- **Classification of job listings**

## API Endpoints

### Feed Management

#### Create New Feed
```http
POST /api/feed/create
```
**Description**: Create a new feed based on the provided information
**Tags**: Feed Creation API

#### Fix Existing Feed
```http
POST /api/feed/fix/single
```
**Description**: Fix an existing feed with updated selectors
**Tags**: Feed Creation API

#### Validate Feed Creation
```http
POST /api/feed/validate/upload
```
**Description**: Upload a CSV file containing company information for feed creation validation
**Tags**: Feed Creation API

#### Download Validation Results
```http
GET /api/feed/validate/download/{fileName}
```
**Description**: Download the processed CSV file with feed creation validation results
**Tags**: Feed Creation API

### URL Processing

#### Upload CSV for Processing
```http
POST /api/url-processing/upload/stream
```
**Description**: Upload a CSV file for processing

#### Download Processed Results
```http
GET /api/url-processing/download/stream
```
**Description**: Downloads the generated CSV file

#### Stop Processing
```http
POST /api/url-processing/stop
```
**Description**: Stop current URL processing

### AI-Powered Mapping

#### Extract Job List Selectors
```http
GET /api/feed/mapping/extract-job-list-delimiter-css
```
**Description**: Extract delimiter CSS selectors for job titles from a given URL. Fetches the page content and uses LLM to extract CSS selectors for job titles.
**Tags**: Feed Mapping API

#### Extract Job Details Selectors
```http
GET /api/feed/mapping/extract-job-details-css
```
**Description**: Extract CSS selectors for job details from a given URL. Fetches the job detail page content and uses LLM to extract CSS selectors for job details.
**Tags**: Feed Mapping API

#### Classify Job Listings
```http
POST /api/feed/mapping/classify-job-list
```
**Description**: Classify job listings
**Tags**: Feed Mapping API

### Pipeline Execution

#### Execute Pipeline
```http
POST /api/pipeline/execute
```
**Description**: Execute a pipeline with YAML config and optional CSV input

#### Get Pipeline Status
```http
GET /api/pipeline/{pipelineId}/{executionId}
```
**Description**: Get pipeline execution status

#### Download Pipeline Results
```http
GET /api/pipeline/{pipelineId}/{executionId}/download
```
**Description**: Download pipeline execution data as CSV for a specific step or current step

#### Get Pipeline Data
```http
GET /api/pipeline/{pipelineId}/{executionId}/data
```
**Description**: Get pipeline execution data for a specific step or current step

#### Get Pipeline Configuration
```http
GET /api/pipeline/{pipelineId}/{executionId}/config
```
**Description**: Get pipeline execution configuration

### Trial Runs

#### Initiate Trial Run
```http
POST /api/v1/trialrun/initiate
```
**Description**: Start a trial run

#### Initiate Trial Run for Specific Feed
```http
POST /api/v1/trialrun/initiate/{feedId}
```
**Description**: Start a trial run for a specific feed

#### Get Trial Run Results
```http
GET /api/v1/trialrun/results/{feedRunUUID}
```
**Description**: Get trial run results

### Webhooks

#### Process Queued Jobs
```http
POST /webhook/{feedRunUUID}/v1/queuedJobs
```
**Description**: Process queued jobs webhook

#### Process Pending Jobs
```http
POST /webhook/{feedRunUUID}/v1/pendingJobs
```
**Description**: Process pending jobs webhook

#### Handle Crawling Events
```http
POST /webhook/{feedRunUUID}/v1/crawlingEvents
```
**Description**: Handle crawling events webhook

### Data & Records

#### Search Crawl Records
```http
GET /api/crawl-records/search
```
**Description**: Search through crawl records

#### Get Record Content
```http
GET /api/crawl-records/records/{id}/content
```
**Description**: Get content for a specific record

#### Get S3 Content
```http
GET /api/crawl-records/content/s3
```
**Description**: Get content from S3 storage

## Key Features

### 1. LLM Integration
- **AI-powered selector extraction**: Uses Large Language Models to automatically identify CSS selectors
- **Intelligent content analysis**: Automatically understands page structure and job data
- **Adaptive learning**: Improves selector accuracy over time

### 2. CSV Processing
- **Bulk URL processing**: Handle large batches of company URLs
- **Structured data export**: Export results in CSV format
- **Data validation**: Comprehensive validation before processing

### 3. Feed Validation
- **Pre-creation validation**: Validate feeds before creation
- **Error detection**: Identify potential issues early
- **Quality assurance**: Ensure feed reliability

### 4. Pipeline Support
- **YAML-based configuration**: Flexible pipeline definitions
- **Multi-step processing**: Complex data transformation workflows
- **Status tracking**: Real-time monitoring of pipeline execution

### 5. Real-time Monitoring
- **Webhook integration**: Real-time feed status updates
- **Event handling**: Process crawling events as they occur
- **Status tracking**: Monitor job queues and processing status

## Use Cases

### 1. Feed Creation
- Create new job feeds from company career pages
- Automatically extract job listings and details
- Validate feed quality before deployment

### 2. Feed Maintenance
- Fix broken feeds with updated selectors
- Adapt to website changes automatically
- Monitor feed health and performance

### 3. Bulk Processing
- Process large lists of company URLs
- Extract job data from multiple sources
- Generate comprehensive reports

### 4. Data Analysis
- Analyze job market trends
- Compare job posting patterns
- Generate insights from job data

## Technical Details

### Authentication
- API requires appropriate authentication (details not specified in public documentation)
- Webhook endpoints use UUID-based authentication

### Data Formats
- **Input**: CSV files, JSON payloads, YAML configurations
- **Output**: CSV files, JSON responses
- **Content Types**: `application/json`, `multipart/form-data`

### Error Handling
- **Standard HTTP status codes**
- **417 Expectation Failed**: Common webhook response
- **200 OK**: Successful operations

### Integration
- **Webhook support**: Real-time event processing
- **S3 integration**: Cloud storage for large datasets
- **LLM integration**: AI-powered content analysis

## Related Documentation

This tool is part of Indeed's broader aggregation ecosystem. For related information, see:
- **Agg3 Feed Mapping**: [AGENT_AGG3.md](./AGENT_AGG3.md)
- **XML Mapping**: [AGENT_XML_MAPPING.md](./AGENT_XML_MAPPING.md)
- **Feed Health Monitoring**: [AGENT_FEED_HEALTH.md](./AGENT_FEED_HEALTH.md)
- **Selector Patterns**: [AGENT_SELECTOR_PATTERNS.md](./AGENT_SELECTOR_PATTERNS.md)

## Environment
- **Sandbox Environment**: `https://disco-analyst.sandbox.indeed.net`
- **Production Environment**: Contact Indeed AggOps team for access

---

*This documentation was generated from the Disco Analyst OpenAPI specification v1.0. For the most current information, refer to the live API documentation at the base URL.*
