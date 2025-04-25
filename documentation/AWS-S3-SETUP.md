# AWS S3 Setup for YoBot Voice Hosting

This guide provides step-by-step instructions for setting up an AWS S3 bucket to host ElevenLabs audio files for SignalWire calls.

## 1. Create an AWS Account (if you don't have one)

Visit [aws.amazon.com](https://aws.amazon.com/) and sign up for an AWS account.

## 2. Create an S3 Bucket

1. Log in to the AWS Management Console
2. Navigate to the S3 service
3. Click "Create bucket"
4. Enter a unique bucket name (e.g., `yobot-audio-files`)
5. Select the AWS Region closest to your users for lower latency
6. Under "Block Public Access settings for this bucket", uncheck "Block all public access"
7. Acknowledge the warning about making the bucket public
8. Keep all other settings at their default values
9. Click "Create bucket"

## 3. Configure Bucket Permissions

1. Select your newly created bucket
2. Go to the "Permissions" tab
3. Under "Bucket policy", click "Edit"
4. Paste the following policy (replace `yobot-audio-files` with your bucket name):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::yobot-audio-files/*"
    }
  ]
}
```

5. Click "Save changes"

## 4. Configure CORS (Cross-Origin Resource Sharing)

1. Stay in the "Permissions" tab
2. Under "Cross-origin resource sharing (CORS)", click "Edit"
3. Paste the following CORS configuration:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["Content-Length", "Content-Type"]
  }
]
```

4. Click "Save changes"

## 5. Create IAM User for Programmatic Access

1. Navigate to the IAM service in AWS Management Console
2. Click "Users" and then "Add users"
3. Enter a name like `yobot-audio-uploader`
4. Select "Access key - Programmatic access" as the access type
5. Click "Next: Permissions"
6. Click "Attach existing policies directly"
7. Search for and select "AmazonS3FullAccess" (for simplicity; you can create a more restrictive policy later)
8. Click through the remaining steps and "Create user"
9. **IMPORTANT**: Download or copy the Access Key ID and Secret Access Key - you will need these for your application

## 6. Set Up AWS CLI Locally (Optional)

1. [Install the AWS CLI](https://aws.amazon.com/cli/)
2. Configure it with your credentials:

```bash
aws configure
```

3. Enter your Access Key ID, Secret Access Key, default region, and output format

## 7. Integrate with YoBot

Add the following environment variables to your production environment:

```
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_REGION=your_selected_region
S3_BUCKET_NAME=yobot-audio-files
```

## 8. Test File Upload and Access

1. Upload a test file using the AWS CLI or console
2. Verify it's publicly accessible by visiting its URL: 
   `https://yobot-audio-files.s3.amazonaws.com/test-file.mp3`
3. Try to access it from a different device to ensure it's truly public

## 9. Cost Considerations

Set up lifecycle rules to manage storage costs:

1. Navigate to your bucket in the S3 console
2. Go to the "Management" tab
3. Click "Create lifecycle rule"
4. Name your rule (e.g., "Delete old audio files")
5. Apply to all objects in the bucket
6. Add a transition rule to move objects to a cheaper storage class after a few days (optional)
7. Add an expiration rule to delete objects after they're no longer needed (e.g., 30 days)
8. Click "Create rule"

## 10. Security Best Practices

For a production environment, consider these additional security measures:

1. Create a custom IAM policy with minimal permissions instead of using AmazonS3FullAccess
2. Set up bucket logging to track access
3. Consider using AWS CloudFront as a CDN in front of your S3 bucket for better performance and additional security options

With this setup complete, your application can now generate audio files using ElevenLabs, upload them to S3, and serve them to SignalWire calls through publicly accessible URLs.