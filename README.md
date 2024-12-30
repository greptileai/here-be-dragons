# Here Be Dragons 🐉

A web application that finds wacky code comments in GitHub repositories. Built with Next.js and the Greptile API.


### Prerequisites

- Node.js 16+
- A Greptile API key (get one from [Greptile](https://greptile.com))
- A GitHub Personal Access Token

### Installation

```bash
git clone https://github.com/greptileai/here-be-dragons.git
cd here-be-dragons
```

Install dependencies:

```bash
npm install
```

Create a .env.local file in the root directory and add your API keys:

```bash
NEXT_PUBLIC_GREPTILE_API_URL=https://api.greptile.com/v2
NEXT_PUBLIC_GREPTILE_API_KEY=your_NEXT_PUBLIC_GREPTILE_API_KEY
NEXT_PUBLIC_GITHUB_TOKEN=your_NEXT_PUBLIC_GITHUB_TOKEN
```

Run the development server:

```
npm run dev
```

Open `http://localhost:3000` in your browser
