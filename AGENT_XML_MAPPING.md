# XML Mapping Knowledge Base - Indeed AggOps

This document contains comprehensive knowledge about XML mapping for Indeed's aggregation operations, sourced from internal documentation.

## Overview

XML mapping is the process of configuring Indeed's aggregation system to properly index job data from XML feeds. This involves understanding different XML file types, testing feeds, mapping data elements, and troubleshooting common issues.

## XML File Types

### 1. Indeed SFTP (Internal)
- **Path format**: `file://var/ftp` or `https://dufe3mhfnuwfs.cloudfront.net/`
- **Scheduling**: Triggered when client uploads new file
- **Access**: Via AggUI "View Uploaded File(s)" or CloudFront index
- **Retention**: Files compressed and moved to archive after processing, stored for 15 days max

### 2. External HTTP/HTTPS
- **Path format**: `https://` or `http://`
- **Scheduling**: Periodic runs via Henson (same as agg3 feeds)
- **Access**: Direct browser access to XML URL

### 3. External FTP/SFTP
- **Path format**: `ftp://` or `sftp://`
- **Scheduling**: Periodic runs via Henson
- **Access**: FTP client or browser with credentials

## Authentication Methods

### Username/Password
- Standard authentication for protected XML files
- Added via "Add Username and Password" in AggUI start tab
- Test credentials by accessing XML directly in browser

### Public-Private Key Authentication
- Used for enhanced security with some clients
- Generate keypair using "Generate Auth Key" in AggUI
- **Critical**: Only share PUBLIC key with client, keep private key internal
- Password used as passphrase to decrypt keypair

## XML Mapping Process

### 1. Test Start URL
- First step: verify XML file accessibility
- Check file size download (may show "0 bytes" total - not necessarily an error)
- Verify authentication if required

### 2. Define Job Element
- **Most Critical Step**: Define the container that holds individual job data
- Common path: `/source/job/` or similar
- All job data elements are relative to this job element

### 3. Auto-mapping
- Use AggUI auto-mapping feature to automatically identify data targets
- Engine attempts to match XML elements to Indeed's data schema

### 4. Manual Mapping Review
- **Remove "Unknown" targets**: Change to correct data target or remove entirely
- **Exception**: Keep "indeed-apply-data" as "Unknown" for Indeed Apply integration
- **Duplicate data targets**: Use plus sign to duplicate (e.g., company name → source name)

## Critical Data Targets

### Job Element
- **Required for every XML**
- Container path that holds complete job data
- Example: `/source/job/` where individual fields are `/source/job/title`, `/source/job/url`, etc.

### Description
- **content:encoded**: Often contains full description (especially WordPress XMLs)
- Multiple description rules joined by double newline
- If multiple values have formatting, joined with BR_NL

### Publish Date/Expiration Date
- **Critical for indexing**: Invalid dates replaced with "today" causing daily job updates
- Must be parseable format
- Invalid dates cause INVPUBDT error

### Company
- Defaults to source name if not specified
- Use "Don't Force Company Name" FLA to prevent default

### Sponsored
- **Special handling**: Can't capture as actual value
- Values "1", "true", "yes", "sponsored" (case-insensitive) → Category: "sponsored"
- Captured value is removed after processing
- Use "Sponsored Budget" for programmatic bidding feeds

### Source
- Defaults to feed name if no rule specified
- Critical for multi-source feeds - always capture source name

## Best Practices

### XML Structure
- Avoid capturing data outside Job Element (won't be indexed, may cause SHLK errors)
- Use RegEx for dynamic filenames with timestamps
- Filename case sensitivity matters
- Avoid extra spaces in start URL

### Multi-source Feeds
- **Always ensure source name capture**
- Duplicate company name for source name if needed
- Use plus sign to duplicate data targets

### Description Handling
- Prefer `content:encoded` over `description` tag for WordPress XMLs
- Ensure full description text is captured
- Check for HTML entity encoding issues

### Character Encoding
- **UTF-8 default**: Most common and preferred
- **ISO-8859-1**: Use for MalformedByteSequenceException errors
- **Warning**: Changing character set can break non-English languages

## Common Errors and Solutions

### BadResponseCodeException
- **403 Forbidden**: Client blocking access - ask client to whitelist "IndeedBot 1.1"
- **404 Not Found**: XML file missing - check client site for active jobs
- **401 Unauthorized**: Invalid credentials - request new username/password
- **500/502/503/504**: Server errors - escalate to Feed Maintenance
- **405/429**: Rate limiting or method issues - escalate to Feed Maintenance

### SAXParseException
- **Client-side XML formatting errors**
- Use xmllint to identify specific error location
- Provide client with Indeed XML Requirements documentation
- Common issues: unclosed tags, invalid characters, premature file end

### File Access Issues
- **FileNotFoundException**: Check FTP archive, feed period (standard: 360), client site status
- **ConnectionTimeout**: Server connectivity issues - escalate to Feed Maintenance
- **0 Errors on 0 Jobs**: Empty XML file - check client site for active jobs

### Character Encoding Issues
- **MalformedByteSequenceException**: Try ISO-8859-1 character set
- **Invalid XML characters**: Client must remove invalid characters
- **Escaped HTML entities**: Should use actual < > characters, not &lt; &gt;

## Programmatic Feeds

### Definition
Programmatic feeds are used by clients with programmatic job advertising platforms that manage, track, and optimize recruitment advertising performance in real-time.

### Identification
- **XML file type**: Always XML format
- **Provider**: Must be in approved programmatic agencies list
- **Naming convention**: "Company Name: Programmatic Platform"
- **FTP location**: Hosted in specific agency FTP folders
- **UDDT requirement**: Must have "Programmatic Bidding" UDDT with platform name

### Key Agencies
- **Clickcast/Appcast**: Multiple FTP folders (ftp439smartclick, ftp570appcast, etc.)
- **JobTarget**: ftp571jobtarget (US)
- **Recruitics**: ftp124onward (Global)
- **PandoLogic**: ftp944indpandologic (US)
- **Joveo**: ftp630joveo (UK)
- **Talentify**: ftp1149Talentify (US)

### Policy Rules
- **Never replace active direct feeds**: Only use disabled/inactive feeds
- **Maintain organic visibility**: Keep direct feeds, set to "Nowhere" if needed
- **Proper naming**: Must match exact format "Company: Agency"
- **UDDT requirement**: Must have programmatic bidding UDDT

## Testing and Validation

### Test Results
- Maximum 9,999 jobs in staging
- Up to 100 jobs visible in AggUI results
- Check for JavaScript requirements on DPUs - add Selenium if needed

### Common Test Issues
- **Blank results**: Try changing character set FLA
- **INVPUBDT error**: Invalid publish date format
- **0s run duration**: May indicate feed run failure on large files

### XML Validation
- Use xmllint via terminal for detailed error analysis
- Identify exact error location in XML file
- Validate against Indeed XML Requirements specification

## Feed Period and Scheduling

### Internal XMLs (SFTP)
- **Trigger**: File upload to client directory
- **Not impacted by feed period**: Runs triggered by file presence
- **Archive**: Files moved to archive with timestamp after processing

### External XMLs
- **Trigger**: Scheduled via Henson based on feed period
- **Standard period**: 360 (6 hours)
- **Monitoring**: Check run history for consistent timing

## Troubleshooting AWS FTP Issues

### Connection Problems
- **Ensure SFTP not FTP**: Use SFTP protocol
- **Port 10022**: Required for new AWS instance
- **Fallback**: old-ftp.indeed.com available as temporary workaround
- **Command test**: `sftp -P10022 <username>@ftp.indeed.com`

### Upload Issues
- **Avoid PASSIVE/ACTIVE modes**: SFTP doesn't support these modes
- **Check client FTP software**: Ensure compatible with SFTP

## Key Tools and Commands

### Testing Commands
- `xmllint --noout <file>`: Validate XML syntax
- `sftp -P10022 <username>@ftp.indeed.com`: Test SFTP connection

### AggUI Functions
- **Auto-mapping**: Automatically detect data targets
- **Test staging**: Validate XML parsing and mapping
- **View uploaded files**: Access Indeed SFTP files
- **Generate auth key**: Create public-private keypair

### Feed Level Attributes (FLA)
- **Character Set**: ISO-8859-1 for encoding issues
- **Date Format**: Custom date parsing patterns
- **Don't Force Company Name**: Prevent default company assignment

## References and Resources

### Client-Facing Documentation
- **Indeed XML Requirements**: https://docs.indeed.com/dev/reference/xml-feed#job-feed-elements
- **Public key cryptography**: https://www.cloudflare.com/learning/ssl/how-does-public-key-encryption-work/

### Internal Resources
- **Programmatic Agencies List**: Google Sheets with FTP mappings and agency details
- **AggUI**: Primary interface for XML feed management
- **CloudFront SFTP Access**: https://dufe3mhfnuwfs.cloudfront.net/index.html

## Escalation Guidelines

### Client-Side Issues
- **XML formatting errors**: Reach out to Customer Service with xmllint output
- **Authentication problems**: Request new credentials from client
- **File access issues**: Check with client about file availability

### Feed Maintenance Issues
- **Server errors (5xx)**: Escalate to Feed Maintenance
- **Connection timeouts**: Escalate to Feed Maintenance
- **Robin Function errors**: Escalate if persistent over multiple days

### Process Administration
- **Programmatic feed requests**: Always route to AggOps Process Administration
- **Feed replacement questions**: Consult with team before proceeding
- **Complex multi-source scenarios**: Escalate for guidance

---

## Source Documentation Access

This knowledge base was compiled from Indeed's internal Confluence documentation. Here's how to access the original sources:

### Primary Source Pages

#### 1. XML Mapping for AggOps Tech
- **Page ID**: 235831627
- **URL**: https://indeed.atlassian.net/wiki/spaces/AggOpsInternal/pages/235831627/XML+Mapping+for+AggOps+Tech
- **Access Command**: 
```bash
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": "confluence_get_page", "arguments": {"page_id": "235831627"}}}' | /opt/homebrew/bin/docker mcp gateway run --transport stdio
```

#### 2. XML Common Engine Errors
- **Page ID**: 235831374
- **URL**: https://indeed.atlassian.net/wiki/spaces/AggOpsInternal/pages/235831374
- **Access Command**:
```bash
echo '{"jsonrpc": "2.0", "id": 2, "method": "tools/call", "params": {"name": "confluence_get_page", "arguments": {"page_id": "235831374"}}}' | /opt/homebrew/bin/docker mcp gateway run --transport stdio
```

#### 3. Programmatic Feeds
- **Page ID**: 235831862
- **URL**: https://indeed.atlassian.net/wiki/spaces/AggOpsInternal/pages/235831862
- **Access Command**:
```bash
echo '{"jsonrpc": "2.0", "id": 3, "method": "tools/call", "params": {"name": "confluence_get_page", "arguments": {"page_id": "235831862"}}}' | /opt/homebrew/bin/docker mcp gateway run --transport stdio
```

### Related Documentation Pages

#### XML Common Investigation
- **Page ID**: 235831372
- **URL**: https://indeed.atlassian.net/wiki/spaces/AggOpsInternal/pages/235831372

#### XML Investigation for AggHealth Support Specialists
- **Page ID**: 235831576
- **URL**: https://indeed.atlassian.net/wiki/spaces/AggOpsInternal/pages/235831576

#### Engine Error Codes
- **Page ID**: 235831476
- **URL**: https://indeed.atlassian.net/wiki/spaces/AggOpsInternal/pages/235831476

#### Validating XMLs for AggHealth
- **Page ID**: 235833908
- **URL**: https://indeed.atlassian.net/wiki/spaces/AggOpsInternal/pages/235833908

#### XML Run Exception
- **Page ID**: 235833905
- **URL**: https://indeed.atlassian.net/wiki/spaces/AggOpsInternal/pages/235833905

#### XML No Recent Runs
- **Page ID**: 235832141
- **URL**: https://indeed.atlassian.net/wiki/spaces/AggOpsInternal/pages/235832141

#### Common Issues with XML - Japan
- **Page ID**: 235833283
- **URL**: https://indeed.atlassian.net/wiki/spaces/AggOpsInternal/pages/235833283

#### Programmatic Feeds for AggOps Tech
- **Page ID**: 235831891
- **URL**: https://indeed.atlassian.net/wiki/spaces/AggOpsInternal/pages/235831891

#### Pre/Post-Deploy Checklists for AggOps Tech
- **Page ID**: 235833725
- **URL**: https://indeed.atlassian.net/wiki/spaces/AggOpsInternal/pages/235833725
- **Access Command**:
```bash
echo '{"jsonrpc": "2.0", "id": 8, "method": "tools/call", "params": {"name": "confluence_get_page", "arguments": {"page_id": "235833725"}}}' | /opt/homebrew/bin/docker mcp gateway run --transport stdio
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

#### Search Commands Used
```bash
# Search for XML Common Engine Errors
echo '{"jsonrpc": "2.0", "id": 4, "method": "tools/call", "params": {"name": "confluence_search", "arguments": {"query": "XML Common Engine Errors", "spaces_filter": "AggOpsInternal", "limit": 10}}}' | /opt/homebrew/bin/docker mcp gateway run --transport stdio

# Search for Programmatic Feeds
echo '{"jsonrpc": "2.0", "id": 5, "method": "tools/call", "params": {"name": "confluence_search", "arguments": {"query": "Programmatic Feeds", "spaces_filter": "AggOpsInternal", "limit": 5}}}' | /opt/homebrew/bin/docker mcp gateway run --transport stdio
```

#### Configuration Files
- **Registry**: `/Users/gvinokur/.docker/mcp/registry.yaml`
- **Config**: `/Users/gvinokur/.docker/mcp/config.yaml`
- **Catalog**: `/Users/gvinokur/.docker/mcp/catalogs/docker-mcp.yaml`

### Note on Documentation Updates
The Confluence documentation is actively maintained and may be updated after this knowledge base was created. Always cross-reference with the live documentation for the most current information.

---

## Deployment Verification Procedures

### Pre-Deployment Preliminary Checks

#### 1. Duplicate Feed Check
- **Policy**: Clients allowed minimum feeds for organic content + 1 additional (SO visibility) for sponsorship
- **Process**: Verify no duplicate feeds exist for same client/content

#### 2. Fraud Detection
- **Tool**: Qual TSReview Chrome extension
- **Process**: Use "aggfraudcheck" option to report suspicious sites
- **Escalation**: Report to Trust and Safety team

#### 3. Apply Method Verification
- **Requirement**: Apply method must exist on job pages
- **Capture**: Only capture apply method if specifically requested

#### 4. ATS Verification
- **Check**: Ensure start URL isn't ATS with existing comprehensive feed
- **Reference**: Review multisource ATS feed list

#### 5. Feed Naming
- **Verification**: Check AFM name matches AggCentral feed name exactly
- **Common Issues**: Typos, incorrect punctuation, name mismatches

### Feed Verification Checklist

#### Feed Period Settings
- **Agg3 Standard**: 360 minutes (4 times daily)
- **Large feeds**: 720 or 1435 minutes (with JavaScript/Proxies)
- **Remote XML**: 360 minutes (http://, ftp:// URLs)
- **Local XML**: Controlled by Henson scheduler (file://var/ftp/ URLs)
- **Leadgen**: 36500 minutes (very high period)
- **Migration Note**: Always change from 36000 to <360 when migrating local XML

#### Critical Feed Level Attributes (FLA)
- **Country Hint/Force**: Set for single-country feeds, blank for multi-country
- **Date Format**: Always set if publish/expiration dates captured
- **Complete Crawl/Update Existing**: Should be activated unless technical issues
- **Rich Formatting (SRF)**: Scrapes HTML formatting from job descriptions

#### Start URL Verification
- **Test Process**: Click "Test Start" button
- **Success Indicator**: 200 status code
- **Preview Window**: May be blank but still functional if 200 received
- **Headers**: Check blue plus sign for sent/received headers

#### Navigation Verification
- **Usage**: Only when technically necessary
- **Test Process**: Click "Test" button in navigation section
- **Verification**: Each URL should show 200 status
- **Show Retrieved Page**: Always check final page crawled
- **Section Transitions**: Count should match distinct sections on site

#### Job List Verification
- **Non-job Exclusion**: Avoid capturing general applications/non-jobs
- **Data Capture**: All retrievable data should be captured on job list
- **Essential Data**: Title, Location, Description (required)
- **Critical Data**: Company, dates, salary, benefits (if >50% consistent)
- **Reference ID**: Clean, minimal, unique, no domain, no session data
- **Pagination**: Verify correct page order and no duplicates
- **Job Count**: Up to 100 jobs per page (default), 25 with pagination

#### Job Details Verification
- **Data Capture**: Only capture data not already on job list
- **Description Best Practices**:
  - Use most specific capture method
  - Include "About Us" section when feasible
  - Include EOE statements
  - Exclude redundant headlines
- **Static URLs**: Must work in incognito/private browsing
- **Location**: Verify raw location captured correctly

### Post-Deployment Verification

#### Daily Post-Deploy Check Process
- **Frequency**: 2-3 random tickets per day from last 14 days
- **Purpose**: Verify production feed performance

#### Step-by-Step Post-Deploy Verification

**Step 1: Definition Testing**
- Navigate to "Definition" tab
- Click "Test All" and review trial run results
- Remove/edit "No Matches" rules if data confirmed absent

**Step 2: Overview Verification**
- Check direct employer status
- Verify ATS and feed period settings

**Step 3: Feed History Analysis**
- Expand runs after deployment
- Verify successful, error-free runs
- Check consistency of job pages and queued jobs

**Step 4: Volume by Country**
- Multi-country feeds: Ensure Country Hint FLA is empty
- Single-country feeds: Verify appropriate country hint

**Step 5: Job Visibilities (Waldo)**
- Check Company, Location, Title captured correctly
- Investigate jobs sent to "Nowhere"
- Click "Missing & Expired Jobs" for discard reasons
- Spot check Job URLs for correct redirects

**Step 6: SERP Verification (aggtest)**
- Access via "Searchable Volume by Country"
- Verify Title, Company, Location, Salary, Job Type display
- Test "Apply" redirects to correct job pages
- Verify OPA/IA apply methods enabled

**Final Step: Documentation**
- Add "postdeploy_checked" label to AFM ticket
- Comment confirmation if no issues
- Create new ticket if unrelated issues found

### Common Post-Deploy Issues and Solutions

#### Too Few Jobs
- **Check**: Compare expected vs actual job count
- **Method**: Search site directly, estimate based on pages/jobs per page
- **Consider**: Non-jobs, aggregated content, reposts may affect count

#### Jobs Discarded
- **ED (Empty Description)**: Description rule not capturing
- **ET (Empty Title)**: Title rule not capturing  
- **BADCNTRY (Bad Country)**: Location rule issues
- **Check Method**: Use ES Discarded Jobs link
- **Analysis**: Compare discard time vs agged version time

#### Broken Navigation
- **Symptoms**: Error pages, no jobs on retrieved pages
- **Test**: Run navigation test and "View Retrieved Page"
- **Fix**: Update navigation rules

#### Broken Pagination
- **Symptoms**: DUPLICATE_REFS errors across full page
- **Test**: Check "View Retrieved Page" for correct pages
- **Expected**: Some duplicates normal for infinite scroll or beyond last page

#### Site Search Limitations
- **Symptoms**: Round numbers (500), "refine search" messages
- **Solution**: Add navigation to work around limits
- **Test**: "View Retrieved Page" for search limitation messages

#### Too Many Jobs
- **Duplicates/Reposts**: Same content, different URLs
- **Solution**: Enable deduplication settings
- **Test**: Search feedid:XXXXX in aggtest for duplicates

#### Wrong Information
- **Wrong Title/Description**: Enable complete crawl/update existing
- **Wrong Location**: Use LocGeocoder tool for location debugging
- **Tool**: https://loccentral.sandbox.indeed.net/locmatchdebug.jsp?type=locgeocode

### Modification Workflow After Deployment
1. **Send to AggOps** → Assign → Assign to Self → Accept
2. **Make necessary changes** to feed definition
3. **Complete Edits** in AggUI
4. **Verify and Deploy** changes
5. **Close AFM ticket** as fixed for Post-Deploy queue

## Quick Reference Checklist

### New XML Feed Setup
1. ✅ Test start URL and authentication
2. ✅ Define job element path
3. ✅ Run auto-mapping
4. ✅ Review and clean unknown targets
5. ✅ Verify critical data targets (title, description, URL, company)
6. ✅ Test in staging environment
7. ✅ Check for JavaScript requirements
8. ✅ Validate date formats
9. ✅ Deploy to production

### Troubleshooting Workflow
1. ✅ Check feed run history
2. ✅ Review error messages and codes
3. ✅ Test XML accessibility manually
4. ✅ Validate XML syntax with xmllint
5. ✅ Check client website for active jobs
6. ✅ Escalate to appropriate team based on error type

### Post-Deployment Verification
1. ✅ Run "Test All" and review trial run results
2. ✅ Verify feed period and ATS settings
3. ✅ Check feed history for successful runs
4. ✅ Validate volume by country settings
5. ✅ Test job visibilities in Waldo
6. ✅ Verify SERP display and apply methods
7. ✅ Add "postdeploy_checked" label to AFM ticket

### Programmatic Feed Verification
1. ✅ Confirm agency in approved list
2. ✅ Verify correct naming convention
3. ✅ Check for programmatic bidding UDDT
4. ✅ Ensure not replacing active direct feed
5. ✅ Route to Process Administration team

This knowledge base should be referenced for all XML mapping activities and kept updated as procedures evolve.
