# Debug Instructions for Stream Navigation Issue

## Current Setup
- **Server**: Running on `http://localhost:5000`
- **Client**: Running on `http://localhost:5173`
- **API Endpoint**: `GET /api/orders` returns 3 live streams:
  - `eiffel-tower-stream`
  - `mount-fuji-stream`
  - `pyramids-stream`

## How to Debug

1. **Open Browser**: Go to `http://localhost:5173`
2. **Open Developer Tools**: Press F12
3. **Go to Console Tab**: Check for any error messages
4. **Go to Network Tab**: 
   - Click "Clear" to clear previous requests
   - Make sure "All" or "Fetch/XHR" is selected
5. **Refresh Page**: Press F5 or Ctrl+R
6. **Look for API Calls**:
   - Find the `/api/orders` request
   - Click on it and check the Response tab
   - Verify it returns the 3 streams with correct IDs

## What to Check When Clicking a Stream

1. **Click on a stream card** on the home page
2. **Check the URL bar**: What URL does it navigate to?
   - Expected: `/stream/eiffel-tower-stream?mode=viewer`
   - If different, note what it shows
3. **Check Network Tab**:
   - Look for a request to `/api/orders/[some-id]`
   - What ID is it requesting?
   - What status code does it return? (200 = success, 404 = not found)
   - If 404, check what ID was requested
4. **Check Console Tab**:
   - Are there any error messages?
   - What does it log for "Active streams:"?

## Expected vs Actual

### Expected Flow:
1. Home page loads → API call to `/api/orders`
2. Returns 3 streams with IDs: `eiffel-tower-stream`, `mount-fuji-stream`, `pyramids-stream`
3. Click stream → Navigate to `/stream/eiffel-tower-stream?mode=viewer`
4. Stream page loads → API call to `/api/orders/eiffel-tower-stream`
5. Returns order data → Stream page displays correctly

### If Getting "Order Not Found":
- Check what ID the stream page is requesting
- Compare with the IDs returned by `/api/orders`
- Look for mismatches in the IDs

## Quick API Tests

Test these URLs directly in your browser or with curl:

```bash
# Get all orders
curl http://localhost:5000/api/orders

# Get specific order
curl http://localhost:5000/api/orders/eiffel-tower-stream
curl http://localhost:5000/api/orders/mount-fuji-stream
curl http://localhost:5000/api/orders/pyramids-stream
```

## Common Issues

1. **Browser Cache**: Try hard refresh (Ctrl+Shift+R) or open in incognito mode
2. **Old Mock Data**: Frontend might still have old mock data mixed with API data
3. **ID Mismatch**: Frontend might be using old IDs that don't exist in backend
4. **Proxy Issue**: Vite proxy might not be forwarding requests correctly

## Please Report

When you encounter the error, please provide:
1. The exact URL you see in the address bar
2. The ID that was requested in the Network tab
3. The status code of the failed request
4. Any console error messages
5. What you see in the browser's Network → Response tab for the failed request

