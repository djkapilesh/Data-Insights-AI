# **App Name**: Data Insights AI

## Core Features:

- Excel File Upload: Enable users to upload Excel files of any format and size.  Accept and parse .xls and .xlsx formats. File upload handling with proper error logging.
- Data Conversion & Storage: Convert uploaded Excel data into a structured SQL database format, resolving inconsistencies and handling unnamed columns using automated naming conventions.
- Natural Language Query Processing: Process user questions in natural language and convert them into SQL queries to extract relevant information from the database. The LLM acts as a tool that decides whether to handle ambiguous questions using an iterative clarification process with the user.
- Data Analysis & Visualization: Analyze the data based on the SQL query results and generate relevant charts (bar, line, pie) and tables to display insights.
- Report Generation: Generate summarized reports that include key findings and visualizations based on user queries.
- Real-time feedback: Provide real-time feedback to the user on the progress of the data extraction, translation to SQL, execution of the SQL statement, and the creation of output charts and tables. Notify of any missing values, and request that missing values are entered when required.
- Email results: Send link to the webapp as well as a link to the github repo to vikas@bulba.app

## Style Guidelines:

- Primary color: Dark blue (#3B5BA9) for a professional, reliable feel.
- Background color: Light blue (#D4E0F3), a desaturated variant of the primary.
- Accent color: Teal (#45ADA8) to contrast with the primary and background for a balanced, harmonious feel.
- Body and headline font: 'Inter' for a modern, machined, objective, neutral feel.
- Code font: 'Source Code Pro' for displaying code snippets.
- Use clean, professional icons representing data, analysis, and reporting.
- Use subtle animations during data processing and chart generation to enhance user experience.