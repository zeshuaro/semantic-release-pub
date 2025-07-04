# semantic-release-pub

[![npm](https://img.shields.io/npm/v/semantic-release-pub)](https://www.npmjs.com/package/semantic-release-pub)
[![License](https://img.shields.io/github/license/zeshuaro/semantic-release-pub)](https://github.com/zeshuaro/semantic-release-pub/blob/main/LICENSE)
[![GitHub Actions](https://github.com/zeshuaro/semantic-release-pub/actions/workflows/github-actions.yml/badge.svg)](https://github.com/zeshuaro/semantic-release-pub/actions/workflows/github-actions.yml)
[![codecov](https://codecov.io/github/zeshuaro/semantic-release-pub/graph/badge.svg?token=P40ZNZNXG2)](https://codecov.io/github/zeshuaro/semantic-release-pub)
[![Codacy Badge](https://app.codacy.com/project/badge/Grade/2694cc48a8dd416798eaab232948090a)](https://app.codacy.com/gh/zeshuaro/semantic-release-pub/dashboard?utm_source=gh&utm_medium=referral&utm_content=&utm_campaign=Badge_grade)
[![Checked with Biome](https://img.shields.io/badge/Checked_with-Biome-60a5fa?style=flat&logo=biome)](https://biomejs.dev)

[![Github-sponsors](https://img.shields.io/badge/sponsor-30363D?style=for-the-badge&logo=GitHub-Sponsors&logoColor=#EA4AAA)](https://github.com/sponsors/zeshuaro)
[![BuyMeACoffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-ffdd00?style=for-the-badge&logo=buy-me-a-coffee&logoColor=black)](https://www.buymeacoffee.com/zeshuaro)
[![Ko-Fi](https://img.shields.io/badge/Ko--fi-F16061?style=for-the-badge&logo=ko-fi&logoColor=white)](https://ko-fi.com/zeshuaro)
[![LiberaPay](https://img.shields.io/badge/Liberapay-F6C915?style=for-the-badge&logo=liberapay&logoColor=black)](https://liberapay.com/zeshuaro/)
[![Patreon](https://img.shields.io/badge/Patreon-F96854?style=for-the-badge&logo=patreon&logoColor=white)](https://patreon.com/zeshuaro)
[![PayPal](https://img.shields.io/badge/PayPal-00457C?style=for-the-badge&logo=paypal&logoColor=white)](https://paypal.me/JoshuaTang)

[semantic-release](https://github.com/semantic-release/semantic-release) plugin to publish a [Dart](https://dart.dev/guides/libraries/create-packages) or [Flutter](https://docs.flutter.dev/packages-and-plugins/developing-packages) package.

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

You can publish to `pub.dev` using either Google Service Account or GitHub Actions OIDC. 

Note that when using GitHub Actions OIDC, `pub.dev` only allows authentication when the workflow is triggered by a `tag` event. See [here](https://github.com/dart-lang/pub-dev/issues/8507) for more details.

#### Google Service Account

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

    1. Navigate to the package Admin tab (pub.dev/packages/<package>/admin).
    2. Click Enable publishing with Google Cloud Service account. 
    3. Type the email of the service account into the Service account email field.
        > You created this account in the previous step: `pub-dev@$PROJECT_ID.iam.gserviceaccount.com`

4. Create exported service account keys for the service account either through the Google Cloud Console under `Service account actions > Manage keys > Add key > Create new key > JSON > Create` or as follow:

    ```bash
    gcloud iam service-accounts keys create key-file.json \
        PROJECT_ID.iam.gserviceaccount.com
    ```

5. Copy the content of the JSON key file and set it as an environment variable under `GOOGLE_SERVICE_ACCOUNT_KEY`.


#### GitHub Actions OIDC

The following instructions are referenced from the [documentation](https://dart.dev/tools/pub/automated-publishing#configuring-automated-publishing-from-github-actions-on-pub-dev) of Dart. Below are the key steps to allow authentication to `pub.dev` via GitHub Actions OIDC.

1. Enable automated publishing.

    > To complete this step, you must have uploader permission on the package or be an admin of the publisher that owns the package.

    1. Navigate to the package Admin tab (pub.dev/packages/<package>/admin).
    2. Click Enable publishing from GitHub Actions.
    3. Then fill in the necessary information.
   
 2. In your workflow, add the `id-token` permission.

    ```yaml
    jobs:
      publish:
        permissions:
          id-token: write
    ```

### Environment variables

| Variable                     | Description                                                                                             |
| ---------------------------- | ------------------------------------------------------------------------------------------------------- |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | The google service account key created from the above steps. Not required if using GitHub Actions OIDC. |

### Options

| Option              | Description                                                                                                                                                                                                                                             | Default |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| `cli`               | The `dart` or `flutter` CLI to use to publish the package to the registry.                                                                                                                                                                              | `dart`  |
| `publishPub`        | Whether to publish the package to the registry. If set to `false`, the `pubspec.yaml` version will still be updated.                                                                                                                                    | `true`  |
| `updateBuildNumber` | Whether to write build number for every newly bumped version in `pubspec.yaml`. Note that the build number will always be increased by one. Learn more on [Flutter docs](https://docs.flutter.dev/deployment/android#updating-the-apps-version-number). | `false` |
| `useGithubOidc`     | Whether to use GitHub OIDC. If set to `true`, authentication to `pub.dev` will be done using GitHub OIDC. Otherwise, the `GOOGLE_SERVICE_ACCOUNT_KEY` will be used.                                                                                     | `false` |

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

See [here](https://github.com/zeshuaro/firestore_cache/pull/162) for a sample pull request utilising this plugin and `semantic-release` to publish a Flutter package.

#### Using GitHub Actions OIDC

```json
{
  "plugins": [
    "@semantic-release/commit-analyzer", 
    "@semantic-release/release-notes-generator", 
    [
      "semantic-release-pub",
      {
        "useGithubOidc": true
      }
    ]
  ]
}
```