Here's an actual use case for our app.

We have many possible structure for clubs and events

---

"Les Citrons Pressés" they meet up here (most of the time) 250 Wilfrid-Hamel Blvd, Québec City, Quebec G1L 5A7

They run two events a week. The nature of the training might change, the distance too. Sometime they do special event with different starting points. This is one of the most complex situation I'd like to support.

---

"Kogi Run" they meet up 1104 18e Rue, Québec, QC G1J 1Z1 every Tuesday @ 18:15 — Except some period of time in winter and sometime when the coffee shop owner closes the shop. They run the same distance pretty much all the time.

---

"Le WKND Trail" — This is what I'll call an organisation or a "Franchise" they have many different "Location" which run their own weekly run club. i.e. they have "Lac Beauport" which meet here 79, chemin du Brûlé, Lac-Beauport, QC G3B 0P9​​ on Sundays always at the same trail. They specialize in trail offering. While the wider organisation exists the implementation of it have their own specificites

"6AM Club" have the same organization (you can look them up in our seed data)

---

Finaly we have some "Organization" that exists while not running any club. i.e. "Je Cours Québec" organize events once in a while they also organize official races and shakeout runs.

---

There are any other in-between setup. I'm wondering if we should change how organization, clubs and events are organized to better reflect all theses possibilities.

———

Let's not forget that to accomodate all of this we need Strava sync (see pending PR https://github.com/maferland/quebec.run/pull/11), we need recurring events, we need one of event. We probably want to have the ability to "Cancel" an event even if it's comming from a recurring event. We also want the ability to pause a club or recurring event.

———

The main thinking for all of this is to have a source of information for users to find clubs and events. We need to have up to date informations and let people find what they want.

One thing I'd like is to have good shareable widgets so it's nice if someone send a ling on a social account.

Something else I'm thinkin is people might look for specific events, specific speed, specific type (i.e. weekend trail is trail, 6am is road), specific objectives (training, social), specific speed range, or even specific distance from their house. THey might also look for more special one of events.

To fully support it I think we need to offer preset filters. in the search widgets we'll offer.

Let's do do few things here.

1. Let's update our roadmap. There are many pending files. Let's make sure we unite them and adapt what needs to be done before the releas. Feel free to look up the git history.
2. Let's think about how we can support all these variety of clubs variant. How can we deal with an org that isn't really a club, do we care?
3. How can we get closer to the reality of our end user. What else might we be missing? How can we make this the one stop shop for running activities.
4. I think also supporting first time club joiner with extra info of how to behave. Either with a default infomercial or with club specific details.
