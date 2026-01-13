# Best Patterns for Creating Robust Selectors and Filters - Web Crawling & Agg3

This guide consolidates best practices from web scraping industry standards and Indeed's internal Agg3 documentation for creating maintainable, robust selectors and filters that resist website changes.

## CSS Selector Best Practices

### 1. **Selector Priority Order (Most to Least Stable)**

```css
/* 1. Unique IDs - Most Stable */
#uniqueId
#product-123

/* 2. Data Attributes - Stable for Testing/Automation */
[data-testid="product-name"]
[data-product-id="12345"]
[data-automation="job-title"]

/* 3. Semantic Class Names - Moderately Stable */
.job-title
.product-price
.company-name

/* 4. Combined Selectors - Good Specificity */
.product-card .job-title
div.content a.job-link

/* 5. Attribute Selectors with Patterns - Flexible */
[class*="product-"]
[href*="/jobs/"]
[id^="job-"]

/* AVOID: Brittle Selectors */
/* - Position-based selectors */
ul li:nth-child(3)
tr:nth-of-type(2)

/* - Overly specific paths */
html > body > div:nth-child(2) > div:nth-child(1) > table

/* - Generic tag selectors */
div, span, p  /* Too generic */
```

### 2. **Indeed Agg3 Specific Patterns**

Based on "Writing Futureproof Selectors and Regular Expressions" documentation:

#### **Dot Notation for Classes**
```css
/* GOOD: Flexible class matching */
.job-post                    /* Matches any element with "job-post" class */
.joblink.blue               /* Chained classes (both required) */

/* AVOID: Exact class matching */
[class="job-post col-md-4"] /* Breaks if class order changes */
```

#### **Table Traversal Best Practices**
```css
/* GOOD: Header-based table rules */
/* Use "is in table row with named column header" in Agg3 */
/* This adapts to column order changes */

/* AVOID: Position-based table rules */
tr td:nth-child(2)          /* Breaks if columns are added/removed */
```

#### **URL and Link Patterns**
```css
/* PDF targeting */
a[href$=".pdf"]             /* Ends with .pdf */
a[href=~/(?i)\.pdf/]        /* Case-insensitive regex */

/* Job URL patterns */
a[href*="/jobs/"]           /* Contains /jobs/ */
a[href^="/careers"]         /* Starts with /careers */
```

### 3. **Fallback Selector Strategies**

Always implement multiple selector options:

```javascript
// Example fallback pattern
const titleSelectors = [
    'h1.product-title',              // Primary
    '.main-content h1',              // Secondary
    '[data-testid="product-name"]',  // Tertiary
    '#productTitle'                  // Fallback
];
```

### 4. **Advanced Selector Combinations**

```css
/* Sibling combinators */
.price + .discount              /* Discount immediately after price */

/* Not selectors */
.product-list > .item:not(.sponsored)

/* Attribute wildcards */
[class*="product-"]             /* Class contains "product-" */
[id^="job-"]                    /* ID starts with "job-" */
[href$=".pdf"]                  /* href ends with ".pdf" */

/* Multiple attribute selectors */
a[href^="/product/"][class="item-link"]
```

## Regular Expression (Regex) Patterns

### 1. **Common Agg3 Filter Patterns**

Based on Indeed's "RegEx 101" documentation:

#### **Return Filters** (Extract specific data)
```regex
# Extract job ID from URL
/jobs/(\d+)

# Extract email addresses
(\S+@\S+[A-Za-z])

# Extract date formats
(\d{4}-\d{2}-\d{2})          # yyyy-MM-dd
(\d{2}-\D{3}-\d{4})          # dd-MMM-yyyy

# Extract parameter from URL
jobid=([^&]+)

# Extract everything after keyword
(?s)Location\s*:\s*([^\n]+)

# Extract everything between two keywords
(?s)Job ID:(.+)Location:
```

#### **Replace Filters** (Remove or modify data)
```regex
# Remove unwanted text
\.html                       # Remove ".html" from URLs
mailto:|?\.*$                # Clean mailto URLs

# Remove prefixes/suffixes
Location:\s*                 # Remove "Location: " prefix
Department:\s*               # Remove "Department: " prefix

# Replace dynamic content
(?s)^(?!.*Salary:)           # Remove entries without "Salary:"
```

### 2. **Global Modifiers (Essential for Agg3)**

```regex
# Case insensitive (most common)
(?i)email                    # Matches "email", "Email", "EMAIL"

# Single-line mode (dot matches newlines)
(?s).*                       # Matches across line breaks

# Multi-line mode (^ and $ match line boundaries)
(?m)^Title:                  # Matches "Title:" at start of any line
```

### 3. **Common Extraction Patterns**

```regex
# Reference ID from various URL patterns
# Pattern 1: /jobs/12345
/jobs/(\d+)

# Pattern 2: jobId=12345&other=value
jobId=(\d+)

# Pattern 3: job-title-12345-location
-(\d+)-

# Extract everything after last slash
/([^/]*)$

# Extract title before location separator
(.*?)(?:\s*[-,]\s*[^-,]*)?$

# Extract salary ranges
\$([,\d]+)\s*-\s*\$([,\d]+)

# Extract phone numbers
(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})

# Extract job types
(?i)(full[- ]?time|part[- ]?time|contract|temporary|internship)
```

## Selector Robustness Strategies

### 1. **Data Attribute Preferences**

```css
/* Best: Purpose-built data attributes */
[data-testid="job-title"]
[data-automation="apply-button"]
[data-product-id="123"]

/* Good: Stable functional classes */
.job-title
.apply-button
.company-name

/* Acceptable: Semantic HTML */
h1, h2, h3                   /* For headings */
article, section             /* For content blocks */
```

### 2. **Avoiding Brittle Patterns**

```css
/* AVOID: Position-dependent selectors */
ul li:nth-child(3)
table tr:nth-of-type(2)

/* AVOID: Overly specific paths */
html body div.container div.content div.job-list ul li

/* AVOID: Generic tag-only selectors */
div span                     /* Too generic */

/* AVOID: Absolute XPath */
/html/body/div[1]/div[2]/table/tr[3]/td[2]
```

### 3. **Dynamic Content Handling**

```css
/* For dynamically generated IDs */
[id*="job-"]                 /* ID contains "job-" */
[class*="product-"]          /* Class contains "product-" */

/* For changing order/structure */
.container .job-title        /* Descendant, not child */
.job-card h3                 /* Semantic relationship */
```

## Filter Composition Patterns

### 1. **Sequential Filter Application**

Filters in Agg3 run sequentially, so order matters:

```regex
# Filter 1: Extract relevant section
(?s)Job Summary:(.*?)(?=Essential Functions|$)

# Filter 2: Clean up whitespace
^\s+|\s+$

# Filter 3: Remove HTML entities
&nbsp;|&amp;|&lt;|&gt;
```

### 2. **Conditional Extraction**

```regex
# Extract location only if it follows a pattern
(?i)location:\s*(.+?)(?:\n|$)

# Extract salary only if present
(?i)salary[:\s]+\$([,\d]+(?:\s*-\s*\$[,\d]+)?)

# Extract job type if mentioned
(?i)(full[- ]?time|part[- ]?time|contract|temporary)
```

### 3. **Fallback Extraction Patterns**

```regex
# Try multiple description patterns
(?s)Job Description:(.*?)(?=Requirements|$)
|(?s)About the Role:(.*?)(?=Qualifications|$)
|(?s)Summary:(.*?)(?=Essential|$)
```

## Best Practices for Agg3 Implementation

### 1. **Reference ID Patterns**

From Indeed's documentation:

```regex
# Prefer "is given by this parameter" when possible
# URL: http://example.com/jobs/lang=2&JobID=1392&view=full
# Use parameter extraction instead of regex

# When regex is necessary:
JobID=(\d+)                  # Simple parameter
/jobs/([^/\?]+)             # Path-based ID
```

### 2. **Description Extraction Strategy**

```css
/* Primary selectors */
div.job-description
section[id*="description"]
.content .description

/* Fallback selectors */
div[class*="description"]
.job-detail-content
main .content
```

### 3. **Location Handling**

```regex
# Extract location from mixed content
# "Software Engineer - New York, NY"
(.+?)\s*[-–]\s*(.+)         # Split title and location

# Clean location prefixes
Location:\s*                 # Remove "Location: "
Based in:\s*                 # Remove "Based in: "
```

## Testing and Validation Patterns

### 1. **Selector Testing Strategy**

```javascript
// Test multiple selectors in order of preference
const testSelectors = [
    '[data-testid="job-title"]',
    'h1.job-title',
    '.job-header h1',
    'h1'
];

// Validate selector returns expected data
function validateSelector(selector, expectedPattern) {
    const elements = document.querySelectorAll(selector);
    return elements.length > 0 && expectedPattern.test(elements[0].textContent);
}
```

### 2. **Regex Testing**

```regex
# Test patterns with sample data
# Sample: "Software Engineer - Remote - $80,000-$120,000"

# Extract title
^([^-]+)                     # "Software Engineer"

# Extract work type
-\s*(Remote|On-site|Hybrid)  # "Remote"

# Extract salary
\$([,\d]+)-\$([,\d]+)       # "80,000" and "120,000"
```

## Common Anti-Patterns to Avoid

### 1. **Brittle Selectors**
```css
/* DON'T: Overly specific */
html > body > div:nth-child(2) > div:nth-child(1) > ul > li:nth-child(3)

/* DO: Semantic and flexible */
.job-listings .job-item[data-id]
```

### 2. **Fragile Regex**
```regex
# DON'T: Too rigid
^Job Title: (.+) Location: (.+) Salary: (.+)$

# DO: Flexible patterns
(?i)job\s*title[:\s]*(.+?)(?=location|salary|$)
```

### 3. **Position Dependencies**
```css
/* DON'T: Position-based */
table tr:nth-child(2) td:nth-child(3)

/* DO: Content-based (Agg3 table header rules) */
/* Use "is in table row with named column header" */
```

## Performance Considerations

### 1. **Selector Performance**
```css
/* Fast: ID and single class */
#job-123
.job-title

/* Medium: Combined selectors */
.job-card .title

/* Slower: Complex traversal */
.container > div:nth-child(odd) .job-item
```

### 2. **Regex Efficiency**
```regex
# Efficient: Specific patterns
\d{4}-\d{2}-\d{2}           # Date pattern

# Less efficient: Greedy quantifiers
(.*)job(.*)title(.*)        # Too broad
```

## Source References

### Web Industry Sources:
- **ScrapingAnt BeautifulSoup Guide**: CSS selector optimization and fallback strategies
- **Browserless Patterns**: Anti-patterns in web scraping, resource management
- **BrowserStack Selenium Guide**: Robust locator strategies

### Indeed Confluence Sources:
- **"Writing Futureproof Selectors and Regular Expressions"** (Page ID: 235831432)
- **"RegEx 101"** (Page ID: 235831397) 
- **"Beginner Agg3 User Guide"** (Page ID: 235831618)
- **"Agg3 FLA Quick Reference"** (Page ID: 235831609)

This guide provides comprehensive patterns for creating maintainable, robust selectors and filters that can adapt to website changes while maintaining reliability in production web crawling systems.
