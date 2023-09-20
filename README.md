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
| `prepare`          | Update the `pubspec.yml` version.                                                                                                                                                   |
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
