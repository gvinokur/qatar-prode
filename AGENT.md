# Agent Configuration and Tools

## MCP (Model Context Protocol) Usage

### Overview
MCP enables agents to access external systems and tools. This project uses Docker MCP Gateway to connect with various services, particularly Confluence.

### Prerequisites
1. **Docker MCP Gateway**: Must be running with required MCP servers
2. **Credentials**: Requires valid API tokens for external services
3. **Access**: Must have appropriate permissions for target systems


### Available MCP Tools

#### Confluence MCP Tools
- `confluence_get_page`: Retrieve specific page content by page ID
- `confluence_search`: Search within Confluence spaces
- `confluence_get_page_children`: Get child pages of a parent page
- `confluence_create_page`: Create new pages
- `confluence_update_page`: Update existing pages
- `confluence_add_comment`: Add comments to pages
- `confluence_add_label`: Add labels to pages

#### Example Usage Commands

##### Retrieve Specific Page
```bash
echo '{"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": "confluence_get_page", "arguments": {"page_id": "PAGE_ID"}}}'
```

##### Search Confluence
```bash
echo '{"jsonrpc": "2.0", "id": 2, "method": "tools/call", "params": {"name": "confluence_search", "arguments": {"query": "SEARCH_TERM", "spaces_filter": "SPACE_KEY", "limit": 10}}}' 
```

### Configuration Files
- **Registry**: `~/.docker/mcp/registry.yaml`
- **Config**: `~/.docker/mcp/config.yaml`  
- **Catalog**: `~/.docker/mcp/catalogs/docker-mcp.yaml`

### Best Practices
1. **Search First**: Use `confluence_search` to find relevant pages before retrieving specific content
2. **Use Page IDs**: More reliable than searching by title for specific page retrieval
3. **Limit Results**: Set appropriate limits for search queries to avoid overwhelming responses
4. **Space Filtering**: Always filter by specific Confluence spaces when possible for better results

### Common Workflows

#### Finding and Reading Documentation
1. Search for relevant pages using `confluence_search`
2. Extract page IDs from search results
3. Retrieve full content using `confluence_get_page`
4. Follow up with child pages if needed using `confluence_get_page_children`

#### Creating Documentation
1. Identify target space and parent page (if any)
2. Use `confluence_create_page` with proper formatting
3. Add relevant labels using `confluence_add_label`
4. Create follow-up comments if needed

### Troubleshooting
- **Connection Issues**: Ensure MCP Gateway is running and credentials are valid
- **Permission Errors**: Verify access rights to target Confluence spaces
- **Invalid Page IDs**: Use search to find current page IDs as they may change

## Project-Specific Commands

### Build and Test Commands
(To be filled in based on project requirements)

### Linting and Type Checking
(To be filled in based on project setup)

### Development Server
(To be filled in based on project configuration)

---

*This AGENT.md file should be updated as new tools and workflows are discovered.*
