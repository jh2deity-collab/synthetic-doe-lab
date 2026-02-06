# Simple test to verify Vercel Python detection
def handler(event, context):
    return {
        'statusCode': 200,
        'body': 'Hello from Vercel Python!'
    }
