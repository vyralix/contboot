
# contboot

`contboot` is a Node.js tool designed to ensure Docker containers with the "always" restart policy are running as expected. This tool checks Docker containers and attempts to start those that are not running, ensuring they are up and running within a specified timeout period.

## Motivation

Docker containers are often set to restart automatically using the "always" policy to ensure they are resilient to failures and reboots. However, there are instances where these containers may not start as expected due to various issues. `contboot` was created to address this problem by providing an automated way to check and start such containers, ensuring they adhere to the intended restart policy.

## Features

- **Docker Availability Check**: Verifies if Docker is available and responsive before proceeding.
- **Container Inspection**: Lists and inspects all containers with the "always" restart policy.
- **Automated Startup**: Attempts to start containers that are not running.
- **Timeout Monitoring**: Monitors the startup process, retrying within a specified timeout period.

## Installation

To install `contboot` globally, run the following command:

```sh
npm install -g contboot
```

## Usage

To run `contboot` and optionally set a timeout period (default is 60 seconds), use the following command:

```sh
contboot [timeout]
```

For example, to set the timeout to 120 seconds:

```sh
contboot 120
```

Work with pm2:

```sh
pm2 start --max-restarts 0 contboot 
pm2 save
```

```sh
pm2 start --max-restarts 0 contboot -- 120
pm2 save
```

## Example Output

Below is an example of the output when running `contboot`:

```plaintext
[2024-07-07 12:31:16:920] [INFO] Starting contboot...
[2024-07-07 12:31:16:938] [INFO] Docker is available.
[2024-07-07 12:31:17:112] [INFO] Found 2 containers with restart policy 'always'.
[2024-07-07 12:31:17:115] [INFO] Inspecting container container1 (79faad9901c)
[2024-07-07 12:31:17:118] [INFO] Container container1 (79faad9901c) is not running. Status: exited
[2024-07-07 12:31:17:133] [INFO] Attempting to start container: container1 (79faad9901c)
[2024-07-07 12:31:17:273] [INFO] Started container: container1 (79faad9901c)
[2024-07-07 12:31:27:285] [INFO] Container container1 (79faad9901c) status: running
[2024-07-07 12:31:27:285] [INFO] Container container1 (79faad9901c) is running.
[2024-07-07 12:31:27:285] [INFO] Ending contboot...
[2024-07-07 12:31:27:285] [INFO] Summary:
[2024-07-07 12:31:27:285] [INFO]   Started containers: 1
[2024-07-07 12:31:27:285] [INFO]   Failed containers: 0
[2024-07-07 12:31:27:285] [INFO]   Execution time: 10165 ms
```

## License

`contboot` is licensed under the MIT License. See the [LICENSE](./LICENSE) file for more details.
