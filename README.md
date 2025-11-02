# MindEase — Empathetic AI Chatbot

A client-first mental-health chatbot using OpenAI. Frontend is static HTML/CSS/JS, serverless backend is a Vercel Node function.

## Prerequisites

- **Node.js** 18.0.0 or higher
- **npm** or **yarn** package manager
- **OpenAI API key** ([Get one here](https://platform.openai.com/api-keys))
- **Vercel CLI** (for local development) - Optional, install with `npm i -g vercel`

## How to run locally

1. **Clone the repository:**
   ```bash
   git clone <your-repository-url>
   cd codepulse2
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Create a `.env` file** in the root directory:
   ```bash
   # Create .env file
   echo "OPENAI_API_KEY=sk-your-api-key-here" > .env
   ```
   
   Or manually create `.env` with:
   ```env
   OPENAI_API_KEY=sk-your-api-key-here
   ```
   
   ⚠️ **Important**: Replace `sk-your-api-key-here` with your actual OpenAI API key. Never commit the `.env` file to version control.

4. **Start the development server:**
   ```bash
   npm run dev
   ```
   
   Or if you have Vercel CLI installed globally:
   ```bash
   vercel dev
   ```

5. **Open your browser** and navigate to `http://localhost:3000` (or the port shown in the terminal)

## Deploy to Vercel

1. **Push your repository** to GitHub (or GitLab/Bitbucket)

2. **On Vercel Dashboard:**
   - Go to [Vercel Dashboard](https://vercel.com)
   - Click **Add New Project** → **Import Project**
   - Select your repository
   - Framework Preset: **Other**
   - Root Directory: `/` (leave default if files are in root)
   - Build Command: (leave empty - static files)
   - Output Directory: (leave empty)

3. **Add Environment Variable:**
   - Go to **Environment Variables** section
   - Add new variable:
     - **Name**: `OPENAI_API_KEY`
     - **Value**: Your OpenAI API key (starts with `sk-`)
   - Make sure to add it for all environments (Production, Preview, Development)

4. **Click Deploy**

5. **Your app will be live** at a Vercel-provided URL (e.g., `your-project.vercel.app`)

### Environment Variables

The following environment variables are required:

| Variable | Description | Required |
|----------|-------------|----------|
| `OPENAI_API_KEY` | Your OpenAI API key | Yes |

**To get an OpenAI API key:**
1. Sign up at [OpenAI Platform](https://platform.openai.com)
2. Navigate to [API Keys](https://platform.openai.com/api-keys)
3. Create a new secret key
4. Copy and use it in your `.env` file or Vercel environment variables

## Project Structure

```
codepulse2/
├── api/
│   └── chat.js          # Serverless API endpoint (Vercel function)
├── index.html           # Main HTML file
├── script.js            # Frontend JavaScript (ES modules)
├── style.css            # Styles and responsive design
├── package.json         # Dependencies and npm scripts
├── vercel.json          # Vercel deployment configuration
├── .env                  # Environment variables (not in repo - create locally)
└── README.md            # This file
```

## Troubleshooting

### Common Issues

**1. "Server error" or "500 Internal Server Error"**
   - Check that `OPENAI_API_KEY` is set in your `.env` file
   - Verify the API key is valid and has credits
   - Check Vercel function logs for detailed error messages

**2. "Module not found" errors**
   - Run `npm install` to ensure all dependencies are installed
   - Verify Node.js version is 18 or higher: `node --version`

**3. API requests failing**
   - Check browser console for CORS errors
   - Verify the API endpoint is accessible at `/api/chat`
   - Check network tab for request/response details

**4. "Too many requests" error**
   - This is rate limiting (8 requests per minute per IP)
   - Wait a moment and try again
   - For production, implement persistent rate limiting (Redis/database)

**5. Vercel deployment issues**
   - Ensure `vercel.json` is in the root directory
   - Check that environment variables are set in Vercel dashboard
   - Review build logs in Vercel dashboard for errors

### Getting Help

- Check [Vercel Documentation](https://vercel.com/docs)
- Review [OpenAI API Documentation](https://platform.openai.com/docs)
- Check function logs in Vercel dashboard for detailed error messages

## Features

- Empathetic AI conversation powered by OpenAI GPT-3.5
- Mood detection and appropriate responses
- Quick action tools (breathing exercises, journaling prompts)
- Resource suggestions based on conversation context
- Responsive design for mobile and desktop
- Rate limiting for API protection

## Notes & Safety

⚠️ **Important Disclaimer**: This chatbot is not a replacement for professional mental health care.

- **For emergencies**: Contact local emergency services or your local crisis hotline immediately
- **Not for medical diagnosis**: This tool provides support, not medical advice
- **Privacy**: Conversations are processed by OpenAI API - review their privacy policy

## Production Considerations

For production deployments, consider:

- ✅ **Persistent rate-limiting**: Use Redis or database instead of in-memory Map
- ✅ **Logging and audit trails**: Implement proper logging for compliance
- ✅ **Prompt engineering**: Regularly review and refine AI prompts
- ✅ **Security**: Add authentication, input sanitization, and additional security measures
- ✅ **Monitoring**: Set up error tracking and performance monitoring
- ✅ **Content moderation**: Add filters for inappropriate content
- ✅ **Cost management**: Monitor OpenAI API usage and costs

## License

This project is licensed under the MIT License. See `package.json` for details.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Acknowledgments

- Built with [OpenAI API](https://openai.com)
- Deployed on [Vercel](https://vercel.com)
- Designed for empathetic mental health support
