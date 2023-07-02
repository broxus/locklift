# API Reference Page Template

The API reference page template stands apart from other sections due to its auto-generated documentation. It is retrieved from the server and delivered to the user, improving the efficiency of documentation management. Here's a brief overview of its structure and key components.

## Template Structure

The template begins with a YAML front matter block with metadata about the page, which looks like this:

```markdown
---
outline: deep
projectName: your-project-name
pageName: your-page-name
apiReference: true
---

<Page projectName="your-project-name" pageName="your-page-name" />
```

- `outline: deep` is a VitePress setting.
- `projectName` represents the name of the project for which the documentation is intended.
- `pageName` indicates the specific page name.
- `apiReference: true` signals that this is an API reference page.

## Key Components

The key components in the page's script include Vue's `onMounted` and `onUpdated` lifecycle hooks. These hooks trigger an API request to fetch the latest API documentation every time the page is mounted or updated. This ensures that the documentation stays up-to-date with the latest changes.

The API request is made using the `getApiReference` function:

```javascript
export async function getApiReference(
  projectName: string,
  pageName: string
) {
  const prod = 'https://creaitive.cloud/api/v1/get/api-reference';
  const dev = 'http://localhost:3000/api/v1/get/api-reference';
  const url = `${dev}?projectName=${encodeURIComponent(projectName)}`;

  // rest of the function
}
```

The `getApiReference` function fetches the API reference for the given project and page from the server.

## Page Rendering

The page's content is then rendered dynamically based on the fetched API documentation. A loading message is displayed while the API request is in progress. Once the API documentation is loaded, it's inserted into the page content:

```html
<template>
  <div v-if="!apiReference.content">Loading...</div>
  <div class="page-container" v-else>
    <div class="page-content" v-html="apiReference.content"></div>
  </div>
</template>
```

Please remember to keep the `apiReference: true` attribute in the front matter of the pages for which you wish to fetch API documentation.
