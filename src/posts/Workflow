---
title: AI, Data, and Meta
date: 2026-02-24
tags: post
layout: post.njk
---
#AI #DataAnalysis 

## Data

I source my data from provincial and federal government datasets. I then process these datasets using various Large Language Models to identify any known errors.

I utilize the Optical Character Recognition tool [Marker](https://github.com/VikParuchuri/marker) to convert PDF documents into clean Markdown format. This process minimizes the risk of model hallucinations. I subsequently manually edit these Markdown files to remove unnecessary columns. Eliminating extraneous information reduces the cognitive load on the model and lowers analysis costs.

I explicitly note that government data is not inherently high quality or highly reliable. These datasets often contain suppressed cells, revised vintages, and methodology changes between collection periods. The model must account for the fact that ministry names and terminology frequently change across different quarters and years.

## Claude.md

I employ multiple agents for distinct tasks. For example, I use a dedicated reading agent that lacks writing capabilities. This strategy effectively limits the token usage and associated costs for specific tasks.

Data is carefully segregated into high reliability and low reliability categories. Subjects like mathematics, physics, engineering, replicated experiments, working code, and government data represent high reliability domains. Conversely, historical narratives, expert predictions, institutional consensus, and politically charged topics represent low reliability domains.

To prevent Claude from analyzing the entire repository, I isolate the specific documents required for the immediate task. I then thoroughly review the generated code before pushing it to GitHub.

## Indexing

I created a Python program to summarize my data and generate an index. Models use this index to efficiently scrub data in future sessions. Indexing my work saves significant time and computational resources.

## Model Use

As of February 24, 2026, my model usage is structured as follows:

- **Claude 3 Opus:** Debugging and resolving complex data analysis problems.
- **Claude 3 Sonnet:** Data cleaning and Exploratory Data Analysis.
- **Claude 3 Haiku and Perplexity Sonnet:** Querying external sources regarding the data.

Prior to publishing, I leverage Perplexity with Sonnet to rigorously critique the data and identify potential improvements.

## Stylistic Preferences

For data visualization, I typically use Tableau or Python libraries within my Integrated Development Environment. My primary preference is Seaborn, as interactive graphs are not a requirement. I currently lack a uniform theme document. Consequently, the model reconfigures visual elements from scratch for every project, which occasionally leads to stylistic discrepancies.

## Reading the Data

I initially read the data myself and organize it into a dedicated folder. Subsequently, I instruct the AI agent to convert all files into a Comma Separated Values format.

The data and associated tables undergo a rigorous cleaning process. Null values are redacted, and datasets are combined whenever structurally possible based on the specific task requirements.
