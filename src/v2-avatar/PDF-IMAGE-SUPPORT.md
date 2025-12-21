# PDF and Image Support Documentation

## Current Implementation

### PDF Display (`show_pdf` tool)

**How it works:**
1. Avatar calls `show_pdf` tool with `url` and `title` parameters
2. Frontend receives tool call via Daily.co data channel
3. Waits for avatar to finish speaking
4. Displays PDF using Google Docs Viewer in an iframe
5. Avatar moves to Picture-in-Picture (PIP) mode in bottom right corner

**Code Location:**
- Tool handler: `TavusAvatarWidget.jsx` line 321-335
- Display: `TavusAvatarWidget.jsx` line 1276-1307
- Uses Google Docs Viewer: `https://docs.google.com/viewer?url={pdfUrl}&embedded=true`

**Supported Formats:**
- ✅ **PDF (.pdf)** - Fully supported via Google Docs Viewer
- ⚠️ **Images** - Not explicitly supported, but Google Docs Viewer can display:
  - JPEG/JPG
  - PNG
  - GIF
  - Some other formats (limited)

**Requirements:**
- URL must be publicly accessible (no authentication)
- URL must be HTTPS (or Google Docs Viewer may block it)
- CORS must allow Google Docs Viewer to access the file

### Image Support

**Current Status:** 
- ❌ No dedicated `show_image` tool exists
- ⚠️ Images might work if passed to `show_pdf` tool, but not guaranteed
- Google Docs Viewer has limited image format support

**Recommended Image Formats (if using show_pdf):**
- JPEG/JPG ✅
- PNG ✅
- GIF ⚠️ (limited support)

## How Avatar Uses It

The avatar receives the PDF/image URL from its system prompt (stored in Tavus persona configuration). When the user asks for a document or image, the avatar:

1. Announces: "Sure, here's the document you requested."
2. Calls `show_pdf` tool with the URL
3. Frontend displays it automatically

## Limitations

1. **No Image-Specific Tool**: Only `show_pdf` exists, no `show_image` tool
2. **Google Docs Viewer Limitations**: 
   - May not support all image formats
   - Requires publicly accessible URLs
   - May have CORS restrictions
3. **URL Must Be Public**: Cannot use private/authenticated URLs

## Recommendations

### To Add Proper Image Support:

1. **Add `show_image` tool** to persona configuration
2. **Create image display handler** in `TavusAvatarWidget.jsx`:
   ```javascript
   case 'show_image':
     // Display image directly (not via Google Docs Viewer)
     setImageUrl(args.url);
     setShowImage(true);
     break;
   ```
3. **Add image display component** similar to PDF overlay but using `<img>` tag instead of iframe

### Current Workaround:

If you need to show images now, you can:
- Pass image URL to `show_pdf` tool (may work for JPEG/PNG)
- Ensure image URL is publicly accessible
- Use HTTPS URLs

## Testing

To test PDF/image display:
1. Configure persona with `show_pdf` tool
2. Add PDF/image URL to persona's system prompt
3. Ask avatar: "Can you show me a document/image?"
4. Avatar should call `show_pdf` tool and display it

## Code References

- **Tool Handler**: `frontend/src/v2-avatar/components/TavusAvatarWidget.jsx:321-335`
- **PDF Display**: `frontend/src/v2-avatar/components/TavusAvatarWidget.jsx:1276-1307`
- **Tool Setup Guide**: `frontend/src/v2-avatar/TAVUS-TOOLS-SETUP.md`


