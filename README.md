# SIMRA Result Viewer Frontend

<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li><a href="#about-the-project">About The Project</a></li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#deploying">Installation</a></li>
        <li><a href="#development">Development</a></li>
      </ul>
    </li>
    <li>
      <a href="#project-structure">Project Structure</a>
      <ul>
        <li><a href="#apps">Apps</a></li>
        <li><a href="#domains">Domains</a></li>
      </ul>
    </li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#resources">Resources</a></li>
    <li><a href="#additional-tools">Additional Tools</a></li>
  </ol>
</details>

## About The Project
SIMRA Result Viewer Frontend is the user interface for the data-driven platform that improves cycling safety by visualizing crowdsourced ride and near-miss incident data. The application helps identify high-risk areas, evaluates urban cycling infrastructure, and provides actionable insights through interactive maps and dashboards.

Built with Angular and Nx, this frontend connects to the [SIMRA Result Viewer Backend](https://github.com/simra/result-viewer-backend) to display cycling safety analytics.

# Getting Started

## Prerequisites
Before you begin, ensure you have the following installed on your local machine:

- Docker: [Install Docker](https://docs.docker.com/get-docker/)
- Docker Compose: [Install Docker Compose](https://docs.docker.com/compose/install/)

1. Clone the repository:
   ```sh
   git clone https://github.com/simra-project/result-viewer-frontend
    ```
2. Start the backend service, check out the [simra backend](https://github.com/simra/result-viewer-backend) for more information.
3. Edit environment variables in .env use the .env.example as a template.

## Deploying
To deploy and explore the application, you can use Docker Compose to set up the necessary services.

1. Run the following command to start the services:
   ```sh
   docker compose up
   ```

2. Access the web application at `http://localhost:25080`.


## Development
To set up the development environment, ensure you have the following installed:
- Node.js (v16 or later): [Install Node.js](https://nodejs.org/)
- Nx CLI: `npm install -g nx`

1. Start frontend development server:
   ```shell
    nx serve
   ```

2. Access the web application at `http://localhost:4200`.

# Project Structure
## Apps

| Name       | Path       | Description                                         |
|------------|------------|-----------------------------------------------------|
| `frontend` | [src](src) | The base entrance point of the angular application. |

## Domains

The nx project is structured into several domain libraries, each responsible for specific functionalities.

| Name        | Path                             | Description                                                                                                                                                                                                            |
|-------------|----------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `common`    | [libs/common](libs/common)       | Shared utilities, types, components, and logic used across the frontend (e.g., atomic design components, helper functions, and constants).                                                                             |
| `incidents` | [libs/incidents](libs/incidents) | Frontend logic for displaying incident data of rides.                                                                                                                                                                  |
| `regions`   | [libs/regions](libs/regions)     | Displays regional risk data and interacts with APIs/services to fetch and filter rides or incidents by region.                                                                                                         |
| `rides`     | [libs/rides](libs/rides)         | Handles ride-related logic: fetching ride data from the backend and providing ride visualization components to check if mapping process was successful, this functionality is not exposes in a production environment. |
| `streets`   | [libs/streets](libs/streets)     | Focuses on street-level data: fetching OSM street information, street safety metrics, and providing components to visualize risk assessment on street map as well as a detailed individual street report.              |


# Contacts

| Role                   | Name               | Contact                                                                                                    |
|------------------------|--------------------|------------------------------------------------------------------------------------------------------------|
| **Project Supervisor** | David Bermbach     | [TU Berlin Profile](https://www.tu.berlin/3s/ueber-uns/team/prof-dr-ing-david-bermbach)                    |
| **Developer**          | David Schmidt      | [Portfolio](https://david.codinggandalf.com) • [Github](https://github.com/KonsumGandalf) |

# Resources

| Resource Type               | Description                                                                   | Link                                                                      |
|-----------------------------|-------------------------------------------------------------------------------|---------------------------------------------------------------------------|
| **Project Management**      | Kanban board tracking development progress and tasks                          | [Simra Project Board](https://github.com/users/KonsumGandalf/projects/11) |
| **K6s**                     | Performance tests to check the capabilities of the application                | [k6s](k6s)                                                                |
| **Live Demonstration**      | Interactive dashboard showcasing real-time cycling safety analytics           | [Simra Dashboard](https://simra.codinggandalf.com)                        |

<p align="right">(<a href="#top">back to top</a>)</p>
