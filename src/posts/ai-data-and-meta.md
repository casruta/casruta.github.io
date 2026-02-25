---
title: AI, Data, and Meta
date: 2026-02-24
tags: post
layout: post.njk
hashtags:
  - AI
  - DataAnalysis
---

Data 
I find my data using government provincial and federal datasets which are then sifted through various LLMs to see whether the data is known to include any errors. 

I use the OCR tool "Marker" to convert PDFs to clean markdown to reduce my decrease the chance for the model to hallucinate, thereby converting all the PDF docs into neat markdown docs. I can then edit the individual markdown files manually, or get rid of unnecessary columns myself. The less unnecessary information the model has to work around, the cheaper the analysis. 

I make sure to highlight that government data is not inherently high quality and high reliability and contain things like suppressed cells revised vintages and methodology changes between collection years. here the model needs to realize that certain ministries names and terminology can be altered from 1 quarter / year / w.e to another. 
### Claude.MD 
I use several agents for different tasks.  For example to read there is an exclusive agent that does not know how to write which limits the amount of tokens I'm being charged for the task I'm working on. 

as for the data segregated higher reliability and low reliability For instance math physics engineering replicated experiments work in code and government data is considered high reliability Whereas historical narratives expert predictions institutional consensus and politically charged topics are considered low reliability. 

In order to prevent Claude from reading the whole repo, depending on the task, I feed it the document it should focus on and review the code before I push it to Github. 

### Indexing & Tree Sitter: 
Created a structured map (AST) for Claude to understand and remember the code structure from previous sessions. Instead of burning tokens re-reading the entire file, it reviews only the branch or w/e which changed -- this is then implemented to work when Claude codes, as opposed to running it in real time. 

For data, I've creased a PDF Indexer, which reads the PDFs I feed it, extract all the tables and text, and stores everything locally in a SQLite Database enabling me then to query that data instantly without opening and reading through the entire PDF again. 

My goal is to use the MCP server to make Claude not read the entire PDF first -- preserving tokens. Claude.MD file, which I run in my main folder so that its global, is then forcing Claude to always use the indexer first, and then only read the PDF upon being prompted to do so. To avoid hallucinating data, I include a line telling Claude to always cite the table ID, page number, and document name. 

The PDF indexer is located here: https://github.com/casruta/PDF-Indexer-, and I am currently looking for an alternative to have Claude scrape the numerical data in the tables before reading any of the text. As of right now, it takes around 2-3 minutes to all numerical data from a 64 page Suncor quarterly performance review. This is obviously 2-5x quicker than any other manual method, but considering that we'll be analyzing 20+ similar documents, its rather pathetic. 

A similar codebase indexer can be found here https://github.com/casruta/Codebase-Indexer-

### Model Use 
- Opus for debugging / complex problems with data & analysis 
- Sonnet for data cleaning and EDA 
- Haiku and Perplexity's Sonnet for questions about the data from external sources

Before publishing, I use Perplexity with Sonnet to poke holes in the data and suggest potential improvements. With the previously mentioned indexer, the odds of the LLM hallucinating the numbers is near zero, at this point.
### Stylistic Preferences
For Visualizing the I typically use tableau Or I use Python libraries to visualize them in my IDE -- my preference is generally seaborn since I don't care about the graphs being interactive. There's no uniform theme.py doc -- so the model reconfigures everything from scratch in very project leading to some visual discrepancies'. 

### Reading the Data 
the data is first and foremost read by me and placed into a separate folder where I will later ask the agent to convert everything into a CSV. 

the data is cleaned and so are the tables null values are redacted, and data is combined whenever possible (and depending on the task). 


