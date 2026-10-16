# After the last run: Explore visibility

Pinpoint review of the cache change found that the full-screen "today is over"
dialog obscures the run list on mobile after the last scheduled run. The date
picker and "View tomorrow" action work, but the initial view shows little of
the site.

This behavior predates the cache change. Consider selecting tomorrow by default
after today's final run, or using a smaller inline state. Check the intended
product behavior before changing it, then review desktop and mobile states
before and after the final run.
