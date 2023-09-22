# semantic-release-pub

[semantic-release](https://github.com/semantic-release/semantic-release) plugin to publish a [Dart](https://dart.dev/guides/libraries/create-packages) or [Flutter](https://docs.flutter.dev/packages-and-plugins/developing-packages) package.

[![npm](https://img.shields.io/npm/v/semantic-release-pub)](https://www.npmjs.com/package/semantic-release-pub)
[![License](https://img.shields.io/github/license/zeshuaro/semantic-release-pub)](https://github.com/zeshuaro/semantic-release-pub/blob/main/LICENSE)
[![GitHub Actions](https://github.com/zeshuaro/semantic-release-pub/actions/workflows/github-actions.yml/badge.svg)](https://github.com/zeshuaro/semantic-release-pub/actions/workflows/github-actions.yml)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=semantic-release-pub&metric=coverage)](https://sonarcloud.io/summary/new_code?id=semantic-release-pub)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=semantic-release-pub&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=semantic-release-pub)
[![Code Style](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://github.com/prettier/prettier)

| Step               | Description                                                                                                                                                                         |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `verifyConditions` | Verify the presence of the `GOOGLE_SERVICE_ACCOUNT_KEY` environment variable, the ability to exchange an identity from the service account, and the `dart` or `flutter` executable. |
| `prepare`          | Update the `pubspec.yaml` version.                                                                                                                                                  |
| `publish`          | Publish the [Dart](https://dart.dev/tools/pub/publishing) or [Flutter](https://docs.flutter.dev/packages-and-plugins/developing-packages#publish) package to the registry.          |

## Installation

Install via `npm`:

```bash
npm install --save-dev semantic-release-pub
```

Or via `yarn`:

```bash
yarn add --dev semantic-release-pub
```

## Usage

The plugin can be configured in the [semantic-release configuration file](https://github.com/semantic-release/semantic-release/blob/master/docs/usage/configuration.md#configuration):

```json
{
  "plugins": [
    "@semantic-release/commit-analyzer", 
    "@semantic-release/release-notes-generator", 
    "semantic-release-pub"
  ]
}
```

## Configuration

### `pub.dev` authentication

The following instructions are referenced from the [documentation](https://dart.dev/tools/pub/automated-publishing#publish-using-exported-service-account-keys) of Dart. Below are the key steps to allow authentication to `pub.dev`.

1. [Create a Google Cloud project](https://cloud.google.com/resource-manager/docs/creating-managing-projects), if you don’t have an existing project.

2. Create a [service account](https://cloud.google.com/iam/docs/service-account-overview) either through the Google Cloud Console under `IAM and admin > Service accounts` or as follow:
   
    ```bash
    gcloud iam service-accounts create pub-dev \
        --description='Service account to be impersonated when publishing to pub.dev' \
        --display-name='pub-dev'
    ```

3. Grant the service account permission to publish your package.

    > To complete this step, you must have uploader permission on the package or be an admin of the publisher that owns the package.

    1. Navigate to the Admin tab (pub.dev/packages/<package>/admin).
    2. Click Enable publishing with Google Cloud Service account. 
    3. Type the email of the service account into the Service account email field.
        > You created this account in the previous step: `pub-dev@$PROJECT_ID.iam.gserviceaccount.com`

4. Create exported service account keys for the service account either through the Google Cloud Console under `Service account actions > Manage keys > Add key > Create new key > JSON > Create` or as follow:

    ```bash
    gcloud iam service-accounts keys create key-file.json \
        PROJECT_ID.iam.gserviceaccount.com
    ```

5. Copy the content of the JSON key file and set it as an environment variable under `GOOGLE_SERVICE_ACCOUNT_KEY`.

### Environment variables

| Variable                     | Description                                                  |
| ---------------------------- | ------------------------------------------------------------ |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | The google service account key created from the above steps. |

### Options

| Option | Description                                                                | Default |
| ------ | -------------------------------------------------------------------------- | ------- |
| `cli`  | The `dart` or `flutter` CLI to use to publish the package to the registry. | `dart`  |

### Examples

#### Publishing a Flutter package

```json
{
  "plugins": [
    "@semantic-release/commit-analyzer", 
    "@semantic-release/release-notes-generator", 
    [
      "semantic-release-pub",
      {
        "cli": "flutter"
      }
    ]
  ]
}
```
