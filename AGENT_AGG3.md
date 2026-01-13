# Agg3 Feed Mapping Knowledge Base - Indeed AggOps

This document contains comprehensive knowledge about Agg3 feed mapping for Indeed's aggregation operations, sourced from internal Confluence documentation.

## Overview

Agg3 is Indeed's Aggregation Engine that uses feeds to scrape/index/crawl job sites for job details. Unlike earlier procedural engines, Agg3 is declarative - you model a site and declare how data should be retrieved using CSS selectors and regex filters.

## Agg3 Architecture

### Core Components

Every Agg3 feed consists of four main components:

1. **Start URL** - The page where the engine begins looking for jobs
2. **Section Navigation** (optional) - Used when sites categorize jobs by location, department, etc.
3. **Job List** - The list of jobs containing basic job information
4. **Job Details** - Individual job pages with detailed information (especially job description)

### How Agg3 Works

- **Declarative Approach**: Model a site and declare how data should be retrieved
- **CSS Selectors**: Use CSS2 language specification for targeting HTML elements
- **Regex Filters**: Extract and modify data using regular expressions
- **Depth-First Navigation**: Engine visits each section completely before moving to the next

## Step-by-Step Agg3 Feed Mapping Process

### 1. Start Tab Configuration

**Purpose**: Define where the Agg3 engine begins looking for jobs

**Setup Process**:
- Enter the start URL
- Choose HTTP method (GET/POST - GET is most common)
- Click "Test Start" to verify 200 response code
- Check "Show Retrieved Page" for content verification

**Best Practices**:
- Configure URL to return maximum number of jobs possible
- Look for "# of results" dropdowns or "Get All" options
- Minimize pagination by maximizing results per page
- Update/add URL parameters to return all available jobs

### 2. Feed Level Attributes (FLAs)

**Definition**: General settings that apply to all stages of the feed

#### Critical FLAs for Most Feeds

| FLA Name | Usage | Description | When to Use |
|----------|-------|-------------|-------------|
| **Complete Crawl** | Most feeds | Forces engine to crawl every page regardless of previous runs | Enable on majority of Agg3 feeds. Not used on high-volume feeds (JV >1000) |
| **Update Existing** | Most feeds | Updates job data if changed from previous run | Enable on majority of Agg3 feeds. Not used on high-volume feeds |
| **Country Hint/Force** | Single-country feeds | Helps geolocation service identify correct country | Use when all jobs are in same country. **Don't use** on multi-country feeds |
| **Date Format** | When capturing dates | Specifies date format using Java SimpleDateFormat | Required when capturing publish/expiration dates |
| **Rich Formatting** | HTML descriptions | Captures HTML formatting from job descriptions | Use when job descriptions contain HTML formatting |

#### Technical FLAs

| FLA Name | Usage | Description | When to Use |
|----------|-------|-------------|-------------|
| **Browser Version** | JavaScript sites | Use Selenium rendering engine | When JavaScript is required. Use "Selenium - Chrome" only |
| **Proxies** | Blocked sites | Routes requests through HTTP proxies | When site returns 403/707 errors or blocks crawler |
| **User Agent** | Browser detection | Specifies custom user agent | When site requires specific browser identification |
| **Character Set** | Encoding issues | Manually specify character encoding | When text appears garbled (try UTF-8 or ISO-8859-1) |
| **JavaScript** | Legacy JS support | **Deprecated** - Use Browser Version instead | Escalate to Tech Input if required |

#### Specialized FLAs

| FLA Name | Usage | Description | When to Use |
|----------|-------|-------------|-------------|
| **HashedRefids** | Duplicate handling | Creates reference ID from title/company/location | When same job appears with different URLs |
| **No Unique URL** | Apply-only jobs | Uses Apply URL instead of Detail Page URL | When only Apply URL is available |
| **Hit Limit** | High pagination | Sets maximum pages to crawl (default: 1000) | When pagination exceeds 1000 pages |
| **Anchor Links** | Table of contents | Enables anchor link navigation | When site uses anchor links for job sections |
| **Frame Support** | iFrame content | Crawls content within iframes | Rarely used - prefer direct iframe URL |

### 3. Section Navigation (Optional)

**Purpose**: Navigate through categorized job listings

**When to Use**:
- Site categorizes jobs by location, department, job type, etc.
- Need to access multiple job lists from a single starting point
- Maximum 3 navigation levels recommended

**Rule Types**:

| Rule Type | Description | Use Case |
|-----------|-------------|----------|
| **Manually specified entries** | Direct GET requests to specific URLs | When you know exact URLs to visit |
| **Form submission** | Submit forms to load jobs | When site requires form submission |
| **Attribute of node** | Extract URLs from page elements using CSS selectors | When navigation links are on the page |
| **Click node by selector** | Click elements to trigger JavaScript | When navigation requires JavaScript interaction |
| **POST requests** | Manual POST requests with parameters | When navigation requires POST data |

**Testing**:
- Each URL should return 200 status
- Use "Show Retrieved Page" to verify content
- Check section transitions count

### 4. Job List Configuration

**Purpose**: Extract basic job information from job listings

#### Required Rules

| Rule | Description | Requirements |
|------|-------------|--------------|
| **Detail Page URLs** | Links to individual job pages | Must be static URLs, no session IDs |
| **Reference ID** | Unique identifier for each job | Must be consistent across runs, clean and minimal |
| **Job Title** | Job title displayed on site | Required for DALT compliance |

#### Critical Data Targets

| Data Target | Priority | Description |
|-------------|----------|-------------|
| **Title** | Required | Job title (part of DALT) |
| **Location** | Required | Job location (part of DALT) |
| **Company** | Critical | Company name (defaults to feed name if not captured) |
| **Publish Date** | Critical | When job was posted (prevents daily updates) |
| **Expiration Date** | Critical | When job expires |
| **Salary** | Important | Salary information (if >50% consistent) |
| **Job Type** | Important | Full-time, part-time, contract, etc. |

#### Pagination Setup

**Variables Available**:
- `#{CURRENT_PAGE_NUMBER}` - Current page number
- `#{CURRENT_PAGE_NUMBER+1}` - Next page calculation
- `#{CURRENT_PAGE_NUMBER*10}` - Offset calculations

**Examples**:
- `page=#{CURRENT_PAGE_NUMBER+1}` - Simple next page
- `offset=#{CURRENT_PAGE_NUMBER*10}` - Skip previous results
- `start=#{CURRENT_PAGE_NUMBER*25}` - 25 results per page offset

### 5. Job Details Configuration

**Purpose**: Capture detailed job information not available on job list

#### Primary Use Case
- **Job Description** - Most common use (required for DALT)
- Additional data not captured on job list
- Apply methods and contact information

#### Best Practices
- Only capture data not available on job list
- Ensure URLs work in incognito/private browsing
- Use most specific CSS selectors possible
- Include "About Us" sections when feasible
- Include EOE (Equal Opportunity Employer) statements

#### Description Capture
- Use `[innerText]` attribute for text content
- Look for `content:encoded` in WordPress XMLs
- Multiple description rules joined by double newline
- Exclude redundant headlines

### 6. Variables and Filters

#### Agg3 Variables

| Variable | Description | Usage |
|----------|-------------|-------|
| `#{REFERENCE_ID}` | Pass reference ID values to other rules | Template URLs, match specific elements |
| `#{CURRENT_PAGE_NUMBER}` | Current page number for pagination | URL parameters, form submissions |
| `#{{2d}REFERENCE_ID}` | Padded reference ID | Adds leading zeros (1 becomes 01) |

#### Filter Types

**Return Filters**:
- Extract substrings using regex grouping
- Example: `jobId=(\d+)` extracts job ID from URL
- Returns captured groups

**Replace Filters**:
- Replace text with other text or nothing
- Example: `\.html` → `` (removes .html)
- Second input can be empty for removal

**Filter Execution**:
- All filters run sequentially on each data instance
- Order matters - filters process in displayed order
- Multiple filters can be used for complex transformations

### 7. Testing and Validation

#### Test Buttons

| Button | Function | Usage |
|--------|----------|-------|
| **Test Start** | Tests start URL only | Verify initial page access |
| **Test Section Navigation** | Tests navigation rules | Verify section discovery |
| **Test Job List** | Tests job list extraction | Verify job data capture |
| **Test Job Details** | Tests job details extraction | Verify description capture |
| **Test All** | Full feed test | Complete feed validation |
| **Quick Test** | Job List + Job Details | Skip start and navigation |
| **Max Test All** | All options at maximum | Comprehensive testing |

#### Validation Checklist

**Start URL**:
- ✅ Returns 200 response code
- ✅ Contains job listings or navigation
- ✅ Accessible without authentication

**Section Navigation**:
- ✅ Each section returns 200 status
- ✅ Sections contain job listings
- ✅ No more than 3 navigation levels

**Job List**:
- ✅ Captures all required data (title, location, company)
- ✅ Reference IDs are unique and consistent
- ✅ Detail Page URLs are static and accessible
- ✅ Pagination works correctly
- ✅ Maximum 100 jobs per page, 25 with pagination

**Job Details**:
- ✅ Job descriptions captured correctly
- ✅ Additional data not on job list
- ✅ URLs work in incognito mode
- ✅ Raw location captured properly

### 8. Feed Settings and Scheduling

#### Feed Period Guidelines

| Feed Type | Period (minutes) | Frequency | Usage |
|-----------|------------------|-----------|-------|
| **Standard Agg3** | 360 | 4 times daily | Most common setting |
| **Large feeds** | 720-1435 | 2-1 times daily | High volume or resource intensive |
| **JavaScript/Proxies** | 720+ | 2 times daily | Resource intensive with special FLAs |

#### Critical Settings

| Setting | Recommendation | Impact |
|---------|----------------|---------|
| **Complete Crawl** | Enable for most feeds | Jobs expire if not found |
| **Update Existing** | Enable for most feeds | Data freshness |
| **Country Hint** | Single-country only | Geolocation accuracy |
| **Date Format** | Set when capturing dates | Prevents INVPUBDT errors |

### 9. Common Issues and Troubleshooting

#### Site Access Issues

| Problem | Solution | FLA to Use |
|---------|----------|------------|
| **403 Forbidden** | Site blocking crawler | Proxies |
| **JavaScript required** | Content loads via JS | Browser Version (Selenium - Chrome) |
| **User agent detection** | Site requires specific browser | User Agent |
| **Character encoding** | Text appears garbled | Character Set |

#### Data Capture Issues

| Problem | Solution | Approach |
|---------|----------|----------|
| **Duplicate jobs** | Same job, different URLs | HashedRefids FLA |
| **Empty descriptions** | Description rule not capturing | Review CSS selectors |
| **Invalid dates** | Date format not recognized | Date Format FLA |
| **Wrong locations** | Location geocoding failing | Country Hint FLA |

#### Performance Issues

| Problem | Solution | FLA/Setting |
|---------|----------|-------------|
| **Timeout errors** | Site too slow | Increase feed period |
| **Hit limit reached** | Too many pages | Hit Limit FLA |
| **Memory issues** | Feed too large | Reduce Complete Crawl scope |

### 10. Advanced Features

#### Procedural Definitions
- **Use Case**: Sites with extra-special needs
- **Requirement**: Jython code knowledge
- **When to Use**: Last resort only
- **Escalation**: Advanced tool for senior members

#### Group Definitions
- **Purpose**: Pre-made definitions for common ATS systems
- **Location**: Feed definition editor (not in FLA panel)
- **Reference**: Agg3 - Group Definition and common ATS mapping guidelines

#### Custom Headers
- **Use Case**: Direct AJAX endpoint access
- **Examples**: `Accept-Language: en`, `Accept: application/json`
- **When**: XHR requests require specific headers

### 11. Best Practices Summary

#### General Guidelines
- **One FLA at a time** when troubleshooting
- **CSS2 selectors** for maximum compatibility
- **Static URLs** that work in incognito mode
- **Minimize pagination** by maximizing results per page
- **Test thoroughly** at each stage

#### Data Capture Guidelines
- **Capture all available data** on job list
- **Only capture new data** on job details
- **Use specific selectors** to avoid wrong data
- **Validate date formats** to prevent errors
- **Include company information** when available

#### Performance Guidelines
- **Standard 360-minute period** for most feeds
- **Complete Crawl + Update Existing** for most feeds
- **Country Hint** for single-country feeds only
- **Selenium** only when JavaScript absolutely required

## Source Documentation Access

This knowledge base was compiled from Indeed's internal Confluence documentation. Here's how to access the original sources:

### Primary Source Pages

#### 1. Beginner Agg3 User Guide for AggOps Tech
- **Page ID**: 235831618
- **URL**: https://indeed.atlassian.net/wiki/spaces/AggOpsInternal/pages/235831618
- **Description**: Comprehensive introduction to Agg3 mapping process
- **Access Command**: 
```bash
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": "confluence_get_page", "arguments": {"page_id": "235831618"}}}' | /opt/homebrew/bin/docker mcp gateway run --transport stdio
```

#### 2. Agg3 FLA Quick Reference
- **Page ID**: 235831609
- **URL**: https://indeed.atlassian.net/wiki/spaces/AggOpsInternal/pages/235831609
- **Description**: Complete Feed Level Attributes reference with usage guidelines
- **Access Command**:
```bash
echo '{"jsonrpc": "2.0", "id": 2, "method": "tools/call", "params": {"name": "confluence_get_page", "arguments": {"page_id": "235831609"}}}' | /opt/homebrew/bin/docker mcp gateway run --transport stdio
```

#### 3. AggOps PA O&T: Agg3
- **Page ID**: 438176159
- **URL**: https://indeed.atlassian.net/wiki/spaces/AggOpsInternal/pages/438176159
- **Description**: Agg3 overview and components explanation
- **Access Command**:
```bash
echo '{"jsonrpc": "2.0", "id": 3, "method": "tools/call", "params": {"name": "confluence_get_page", "arguments": {"page_id": "438176159"}}}' | /opt/homebrew/bin/docker mcp gateway run --transport stdio
```

#### 4. Agg3 - Group Definition and Common ATS Mapping Guidelines
- **Page ID**: 235831400
- **URL**: https://indeed.atlassian.net/wiki/spaces/AggOpsInternal/pages/235831400
- **Description**: Mapping rules for established group definitions and ATS systems
- **Access Command**:
```bash
echo '{"jsonrpc": "2.0", "id": 4, "method": "tools/call", "params": {"name": "confluence_get_page", "arguments": {"page_id": "235831400"}}}' | /opt/homebrew/bin/docker mcp gateway run --transport stdio
```

### Related Documentation Pages

#### General Investigation (Agg3)
- **Page ID**: 235831376
- **URL**: https://indeed.atlassian.net/wiki/spaces/AggOpsInternal/pages/235831376
- **Description**: Troubleshooting guidelines for Agg3 feeds

#### Location for AggOps Tech
- **Page ID**: 235831499
- **URL**: https://indeed.atlassian.net/wiki/spaces/AggOpsInternal/pages/235831499
- **Description**: Location handling and geocoding guidelines

#### Pre/Post-Deploy Checklists for AggOps Tech
- **Page ID**: 235833725
- **URL**: https://indeed.atlassian.net/wiki/spaces/AggOpsInternal/pages/235833725
- **Description**: Deployment verification procedures

#### AggOps Vocabulary
- **Page ID**: 235831311
- **URL**: https://indeed.atlassian.net/wiki/spaces/AggOpsInternal/pages/235831311
- **Description**: Glossary of AggOps terminology

#### AggHealth AggMon Heuristics
- **Page ID**: 235832265
- **URL**: https://indeed.atlassian.net/wiki/spaces/AggOpsInternal/pages/235832265
- **Description**: Monitoring and health check procedures

#### SwAggOps
- **Page ID**: 235831799
- **URL**: https://indeed.atlassian.net/wiki/spaces/AggOpsInternal/pages/235831799
- **Description**: SwAggOps functionality and custom buttons

### Search Commands Used

#### Agg3 Configuration Search
```bash
echo '{"jsonrpc": "2.0", "id": 5, "method": "tools/call", "params": {"name": "confluence_search", "arguments": {"query": "Agg3 configuration", "spaces_filter": "AggOpsInternal", "limit": 10}}}' | /opt/homebrew/bin/docker mcp gateway run --transport stdio
```

### How to Access Confluence via MCP

#### Prerequisites
1. **Docker MCP Gateway**: Must be running with Atlassian MCP server
2. **Credentials**: Requires valid Confluence API token and personal token
3. **Access**: Must have permissions to Indeed's AggOpsInternal space

#### Starting the MCP Gateway
```bash
/opt/homebrew/bin/docker mcp gateway run
```

#### Available Confluence Tools
- `confluence_get_page`: Retrieve specific page content
- `confluence_search`: Search within Confluence spaces
- `confluence_get_page_children`: Get child pages of a parent page

#### Configuration Files
- **Registry**: `/Users/gvinokur/.docker/mcp/registry.yaml`
- **Config**: `/Users/gvinokur/.docker/mcp/config.yaml`
- **Catalog**: `/Users/gvinokur/.docker/mcp/catalogs/docker-mcp.yaml`

### Note on Documentation Updates
The Confluence documentation is actively maintained and may be updated after this knowledge base was created. Always cross-reference with the live documentation for the most current information.

## Quick Reference Checklist

### New Agg3 Feed Setup
1. ✅ Configure start URL and test for 200 response
2. ✅ Set up critical FLAs (Complete Crawl, Update Existing, Country Hint)
3. ✅ Configure section navigation if needed (max 3 levels)
4. ✅ Set up job list rules (DPU, Reference ID, Title)
5. ✅ Configure pagination if required
6. ✅ Set up job details rules (primarily description)
7. ✅ Test all components individually
8. ✅ Run "Test All" for complete validation
9. ✅ Verify date formats and location geocoding
10. ✅ Deploy to production

### Troubleshooting Workflow
1. ✅ Test start URL accessibility
2. ✅ Verify section navigation (if used)
3. ✅ Check job list data capture
4. ✅ Validate job details extraction
5. ✅ Review FLA configuration
6. ✅ Test with different browsers/incognito mode
7. ✅ Check for JavaScript requirements
8. ✅ Validate CSS selectors and filters
9. ✅ Escalate to appropriate team if needed

### FLA Troubleshooting
1. ✅ Enable one FLA at a time
2. ✅ Test impact of each FLA individually
3. ✅ Check for FLA conflicts
4. ✅ Verify FLA necessity
5. ✅ Document FLA usage reasoning

This knowledge base should be referenced for all Agg3 feed mapping activities and kept updated as procedures evolve.
