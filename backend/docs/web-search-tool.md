# DuckDuckGo Search Tool Documentation

This guide shows how to use the DuckDuckGo search component in your application. DuckDuckGo is a privacy-focused search engine that provides an alternative to other search services.

## Prerequisites

The required dependencies are already included in the project:

- `duckduckgo-search>=8.1.1`
- `langchain-community>=0.3.29`

## Basic Usage

### Simple Search with DuckDuckGoSearchRun

For simple searches that return a concise answer:

```python
from langchain_community.tools import DuckDuckGoSearchRun

search = DuckDuckGoSearchRun()

result = search.invoke("Obama's first name?")
print(result)
```

Output:

```
"Barack Obama (born August 4, 1961, Honolulu, Hawaii, U.S.) is the 44th president of the United States (2009-17) and the first African American to hold the office..."
```

## Detailed Search Results

### Using DuckDuckGoSearchResults

For more detailed information including links, sources, and snippets:

```python
from langchain_community.tools import DuckDuckGoSearchResults

search = DuckDuckGoSearchResults()

result = search.invoke("Obama")
print(result)
```

By default, results are returned as a comma-separated string of key-value pairs.

### Different Output Formats

You can customize the output format based on your needs:

#### List Format

```python
search = DuckDuckGoSearchResults(output_format="list")

result = search.invoke("Obama")
print(result)
```

Output:

```python
[
    {
        'snippet': 'Obama was headed to neighboring Michigan later Tuesday...',
        'title': 'Obama and Walz host rally in Wisconsin as early voting kicks off | AP News',
        'link': 'https://apnews.com/article/wisconsin-voting-trump-harris-obama-walz-aeeff20ab17a54172263ee4778bed3dc'
    },
    {
        'snippet': 'Learn about the life and achievements of Barack Obama...',
        'title': 'Barack Obama | Biography, Parents, Education, Presidency, Books ...',
        'link': 'https://www.britannica.com/biography/Barack-Obama'
    },
    ...
]
```

#### JSON Format

```python
search = DuckDuckGoSearchResults(output_format="json")

result = search.invoke("Obama")
print(result)
```

### Searching for News

To specifically search for news articles, use the `backend="news"` parameter:

```python
search = DuckDuckGoSearchResults(backend="news")

result = search.invoke("Obama")
print(result)
```

News results include additional metadata like publication date and source:

```python
{
    'snippet': 'Springsteen, a longtime Democratic activist, will be joined by former President Barack Obama...',
    'title': 'Bruce Springsteen to hold battleground concerts with Kamala Harris, Barack Obama',
    'link': 'https://www.statesman.com/story/news/politics/elections/2024/10/22/springsteen-obama-2024-concerts-harris/75791934007/',
    'date': '2024-10-22T20:45:00+00:00',
    'source': 'Austin American-Statesman'
}
```

### Customizing Search Parameters

For more control over search results, you can directly pass a custom `DuckDuckGoSearchAPIWrapper`:

```python
from langchain_community.utilities import DuckDuckGoSearchAPIWrapper

wrapper = DuckDuckGoSearchAPIWrapper(
    region="de-de",      # Search region
    time="d",            # Time filter: d (day), w (week), m (month), y (year)
    max_results=2        # Maximum number of results
)

search = DuckDuckGoSearchResults(api_wrapper=wrapper, backend="news")

result = search.invoke("Obama")
print(result)
```

## Integration with Existing Tools

The DuckDuckGo search tool can be integrated alongside existing tools in your application. For example, you might want to offer users a choice between different search providers:

```python
# Example of offering multiple search options
def search_web(query, provider="serpapi", **kwargs):
    if provider == "duckduckgo":
        from langchain_community.tools import DuckDuckGoSearchResults
        search = DuckDuckGoSearchResults(**kwargs)
        return search.invoke(query)
    elif provider == "serpapi":
        # Your existing SerpAPI implementation
        return web_search(query, **kwargs)
    else:
        raise ValueError(f"Unsupported search provider: {provider}")
```

## Error Handling

When using the DuckDuckGo search tools, consider handling potential errors:

```python
from langchain_community.tools import DuckDuckGoSearchResults

try:
    search = DuckDuckGoSearchResults()
    result = search.invoke("your query")
    # Process result
except Exception as e:
    print(f"Search failed: {e}")
    # Handle error appropriately
```

## Best Practices

1. **Rate Limiting**: Although DuckDuckGo doesn't have strict API rate limits, be respectful with your usage to avoid being blocked.

2. **Result Processing**: Always process and validate search results before presenting them to users, as they may contain irrelevant or unexpected content.

3. **Privacy Considerations**: DuckDuckGo is privacy-focused, making it a good choice when user privacy is a concern.

4. **Fallback Options**: Consider implementing fallback search options in case one service is unavailable.

5. **Result Limiting**: Use the `max_results` parameter to limit the number of results and prevent overwhelming responses.

## Example Implementation

Here's a complete example of how you might implement a DuckDuckGo search tool in your application:

```python
from langchain_core.tools import tool
from langchain_community.tools import DuckDuckGoSearchResults
from typing import Optional, Dict, Any

@tool
def duckduckgo_search(
    query: str,
    max_results: int = 5,
    backend: str = "text"
) -> Dict[str, Any]:
    """Search the web using DuckDuckGo for current information.

    Args:
        query: Search term or question
        max_results: Maximum number of results to return (default: 5)
        backend: Search backend - "text" for general search, "news" for news articles

    Returns:
        Dictionary containing search results
    """
    try:
        # Create search instance with custom parameters
        search = DuckDuckGoSearchResults(
            output_format="list",
            backend=backend,
            max_results=max_results
        )

        # Perform search
        results = search.invoke(query)

        return {
            "query": query,
            "results_count": len(results),
            "results": results
        }

    except Exception as e:
        return {
            "query": query,
            "error": f"Search failed: {str(e)}",
            "results_count": 0,
            "results": []
        }
```

This implementation provides a clean interface that can be easily integrated into your existing tool ecosystem.
