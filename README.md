# RIS Unit Browser

A unit browser for the [RTR: Imperium Surrectum mod](https://steamcommunity.com/sharedfiles/filedetails/?id=2487698001) for Total War: ROME REMASTERED.

The live website can be accessed at [ris-unit-browser.jorellaf.com](ris-unit-browser.jorellaf.com).

## Instructions of Use

## Disclaimer

This code was built specifically for the specific setup of RIS and its repository. While some effort has been made to make it generic enough, **IT WILL LIKELY NOT WORK OUT OF THE BOX FOR YOU WITHOUT EDITING THE CODE ITSELF**.

## Instructions

Open this folder in Visual Studio Code (using WSL is recommended if on Windows).
Create a `local.env` file inside `.dockercontainer` with your own environment variables used to set up the site. Each setting in this file should be in its own line, and have the format `SETTING_NAME=VALUE`.

See below for what environment variables are needed.

Next, reopen this folder in a container.

---

### Fetching the Data
Run the `repo_files_downloader.py` file using Python after having set your environment variables correctly. The script works by querying a git repository for the necessary game files to build the website.

The script assumes that all tags in the repo are releases. RIS uses the template of `release-X.Y.Z` for its tags, so for the website generation (see below), the first part is removed to show only the version number.

### Site Generation

The template uses Gatsby to generate all the pages for all units and all releases. It is highly recommended to familiarse yourself with the way Gatsby works if you want to make changes or if there are issues during site generation.

You can use the usual commands (`npm run develop`, `npm run build`) to run Gatsby, but you can also run the helper functions by just calling `run_develop` and `run_build` (which also does a `npm run clean`) instead.

### Development

To preview the website for development, use `run_develop`, and navigate to `localhost:8080` on your browser. All changes you make in the website files should also appear automatically. If not, a simple refresh is most likely all that is needed.

### Deployment

To build the website for deployment (i.e. to actually put it online), use `run_build`.
**This process can take a while**.

Once the website is built, you can simply copy the contents of the newly-created `public` folder, and put it online to your convenience. Once that simple upload process is done, the website and all its unit pages should be available to view!

---

### Required and Optional Environment Variables

**The required variables are:**
- `MOD_NAME`: self explanatory.
- `MOD_DESCRIPTION`: used for the website description that appears in search engines.
- `PROJECT_ACCESS_TOKEN`: your access token for fetching data from your git repository.
- `BASE_URL`: the base URL of your git repository (e.g. `https://example.com`)
- `REPO_NAME`: the name of your repository (e.g. `example-repo`)
- `REMOTE_DATA_PATH`: the path from your repository root directory to where your mod's data folder is (e.g. `mod-name/data`)
- `SITE_URL`: the URL where you will host your instance of your unit browser
- `SITE_AUTHOR`: you.
- `MOD_AUTHORS`: in case the mod authors are not the same as you, otherwise you again,
- `COPYRIGHT_FROM`: the start **YEAR** of the copyright notice, such as when the mod was started.

---

**Some additional settings you can change in case it is necessary:**
- `ENCODING_CUTOFF`: in case your git stores `data/text` files in UTF-16LE-BOM instead of UTF-8, you need to set this value to something higher than 0
- `MP_POOL_SIZE`: in case you want to add more or fewer workers for the parallelised fetching of git data and metadata
- `BASE_PATH_RELATIVE` in case you wish to change the directory where the raw mod files are stored (**NOT RECOMMENDED**. You will need to change the Gatsby config file manually at the very least)
