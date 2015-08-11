
1.1.0 / 2014-10-08 
==================

 * Merge branch 'master' into stage
 * updated post-nominate script
 * erge branch 'master' of vcs.diamonddogs.cc:globalrockstar-api
 * Fix money donated for project calc
 * add sub platform to vote
 * changed es config for logstash
 * Merge branch 'master' of vcs.diamonddogs.cc:globalrockstar-api
 * post nominate mailer
 * script to automatically nominate songs
 * added postNominate property to chart_entry and song model
 * add customcallback handler
 * Merge branch 'payment'
 * remove commented code
 * Appen/Prepend empty string to amounts in cvs file - otherwise Excel interpreted them as dates (!)
 * es import scripts
 * validation-fixes for currency in fans and artist schema
 * micropayments config in amazon.js
 * Project details
 * Merge branch 'master' of vcs.diamonddogs.cc:globalrockstar-api
 * added new field to artist-paypal-check model .. save user_email
 * updated scripts to get non-existing audio-files
 * updated legacy config
 * Calculate Project stats using the reference dollarAmount
 * add check if email is provided
 * Merge branch 'master' into payment
 * Merge branch 'master' of vcs.diamonddogs.cc:globalrockstar-api
 * user email to find facebook user and optionally add fb id to user
 * Fix to use default value
 * Remove limit
 * Impleement runner/guess-paypal-accounts.js
 * removed currency
 * countries stuff
 * Merge branch 'master' of vcs.diamonddogs.cc:globalrockstar-api
 * stuff
 * Save dollar amount and exchangeRate in project payments Complete Projects based on the dollarAmounts
 * Merge branch 'payment'
 * Re-add currency properties - but nail to 'dollar' with pre save hook
 * Merge branch 'master' into payment
 * Check currency before initialise payment - WIP
 * schedule events
 * added artist-video-reminder mailer
 * Merge branch 'master' of vcs.diamonddogs.cc:globalrockstar-api
 * artist completion mailer
 * Merge branch 'payment'
 * Merge branch 'master' of vcs.diamonddogs.cc:globalrockstar-api
 * Merge branch 'master' into payment
 * Make the "currency" property virtual and always return "dollar"
 * remove page before adding to enable updating of a facebook page to another artist GR-137
 * Handle PayPal Server down gracefully
 * Merge branch 'master' of vcs.diamonddogs.cc:globalrockstar-api
 * es import stuff
 * added GR-Team api support
 * Merge branch 'master' of vcs.diamonddogs.cc:globalrockstar-api
 * use slug instead of id
 * Implement: only Aritist currency used for payments - WIP
 * Remove commented code
 * Merge branch 'paypal-form'
 * Return supported currencies
 * New payPal form - WIP
 * updated scheduled mailer for paypal-reminder
 * yoo
 * check for env in scheduled-mailer template
 * require scheduled mailers
 * perf log output
 * updated amazon config: - paypal micropayments is paypal default config - mandril api key changed
 * return next
 * Merge branch 'stage'
 * Merge branch 'master' of vcs.diamonddogs.cc:globalrockstar-api
 * micropayment config for amazonstage env
 * Merge branch 'master' of vcs.diamonddogs.cc:globalrockstar-api
 * remove @TODOs
 * New payPal form - WIP
 * wrong mandrill api key in amazon stage env
 * Merge branch 'master' into stage
 * added gr-test mailer
 * yt id fix
 * Merge branch 'master' of vcs.diamonddogs.cc:globalrockstar-api
 * added catbox-redis
 * live merges
 * Add stub Route/Controller to check if account accepts a currency
 * Add currency <-> country code mapping file
 * Script to query the PP AdaptivePayments CurrencyConvert API
 * update paypal sectin for stage
 * check for audiofile in nomination route
 * Merge branch 'master' of vcs.diamonddogs.cc:globalrockstar-api
 * live changes
 * Add micropayment settings
 * Micropayment Account data  
 * Fix race condition caused by IPN error message and UI triggered payment abort
 * Fix mongo error when saving "parsed" ion caused by invalid key names
 * Fix tests, remove simple payment
 * Implement PayPal account switch based on amount & currency of the payment
 * Get rid of unused "payPal.grCollectivePayPalEmail" setting
 * Merge branch 'master' into paypal-micropayment-account
 * updated scheduledmailer template .. only send to gr and dd
 * updated scheduled-mailer.js
 * Merge branch 'master' of vcs.diamonddogs.cc:globalrockstar-api
 * updated scheduled-mailer
 * added mandrill template for scheduled mailer
 * updated scheduled mailer
 * require scheduled mailer
 * update song stats
 * sort current chart songs by stars desc
 * fans detail stat fixes
 * artist-detail stat fixes
 * Replace useless singel value $in statements
 * Merge branch 'master' of vcs.diamonddogs.cc:globalrockstar-api
 * Make country, phase, genres_own, genres and featured use match values instead of RegEx for the queries
 * Merge branch 'master' of vcs.diamonddogs.cc:globalrockstar-api
 * fix $in query GR-1204
 * Merge branch 'master' of vcs.diamonddogs.cc:globalrockstar-api
 * Script to validate manual entered paypal data
 * Merge branch 'master' of vcs.diamonddogs.cc:globalrockstar-api
 * implement get artist from FB page GR-138
 * add index to facebook pages
 * add route to add FB page to artist profile
 * Send eplty response on success
 * Merge branch 'master' of vcs.diamonddogs.cc:globalrockstar-api
 * Provide meaningful error messages for PayPal account verification form
 * artists recommendation changes
 * Merge branch 'master' of vcs.diamonddogs.cc:globalrockstar-api
 * Merge branch 'master' of vcs.diamonddogs.cc:globalrockstar-api
 * Implemnet Payment lockForCommit - IPN vs UI triggered Paymanet finish Merge branch 'payment'
 * paypal mailer update
 * Merge branch 'master' of vcs.diamonddogs.cc:globalrockstar-api
 * Nice PayPal check output Make verify script sequential
 * Merge branch 'master' of vcs.diamonddogs.cc:globalrockstar-api
 * Duplicate YoutTube video handling
 * es.js
 * get votingserie notification on profile
 * set status to processed for series votes
 * Merge branch 'master' of vcs.diamonddogs.cc:globalrockstar-api
 * aggregate stats in controller
 * Don't throw error on artist settings update caused by cast errors
 * Comment out obsolete Payments
 * Merge branch 'stage' of git.lan.ddg:global-rockstar/rest-api
 * Merge branch 'master' of vcs.diamonddogs.cc:globalrockstar-api
 * Make PayPal updates more explicit - log 'em all!
 * merged
 * Merge branch 'stage' of vcs.diamonddogs.cc:globalrockstar-api into stage
 * Merge branch 'master' of vcs.diamonddogs.cc:globalrockstar-api
 * temp file
 * newrelic config
 * various workers
 * paypal-verify mail changes
 * contest-administration fixes
 * no idea
 * stage version of contestants logic
 * fake charts
 * bugfixes in charts detail
 * updated amazon config
 * revert quickfix for paypal unicode problem
 * Merge branch 'master' of vcs.diamonddogs.cc:globalrockstar-api
 * Update require paypal-adaptive version
 * add maxsockets to server
 * add maxsockets to index
 * Merge branch 'master' of vcs.diamonddogs.cc:globalrockstar-api
 * stuff
 * Merge branch 'master' into stage
 * Verify PayPal user by requesting a chained payment
 * Merge branch 'master' of vcs.diamonddogs.cc:globalrockstar-api
 * Check accepted currencies in PayPal verify
 * Merge branch 'master' of vcs.diamonddogs.cc:globalrockstar-api
 * add state check for artists
 * fans to votes script
 * Cache config on first request
 * Merge branch 'master' into stage
 * Merge branch 'stage' of vcs.diamonddogs.cc:globalrockstar-api into stage
 * check youtube urls
 * Merge branch 'master' of vcs.diamonddogs.cc:globalrockstar-api
 * Add verify Paypal accounts script
 * Merge branch 'master' into stage
 * use slug for paypal request if itemname contains utf8
 * chart-entries . bootstrapping
 * Merge branch 'stage' of vcs.diamonddogs.cc:globalrockstar-api into stage
 * amazon config -> paypal
 * Merge branch 'master' into stage
 * populate state
 * Revert "also populate state"
 * Implement 'commit-abort-pending' state in Payment  - WIP Use Payment.lockForCommit('paymentId') in paypal controller for flow finishes
 * Remove some console noise
 * Merge branch 'master' into stage
 * fans to votes sciprt
 * Ignore Payment commits - when payment not in 'created" state instead of throwing an error.
 * update ipn notification url
 * Merge branch 'master' into stage
 * merged master -> stage for artist.js
 * Merge branch 'master' of vcs.diamonddogs.cc:globalrockstar-api
 * notify artist fixes ba notyce
 * merged
 * ipn notification url in amazonstage config
 * kill me kill me now
 * import votes script
 * merged bla foo
 * foo
 * buh
 * Merged
 * notify artist about missed vote
 * Merge branch 'master' of vcs.diamonddogs.cc:globalrockstar-api
 * Implement PayPal Form in Projects Admin
 * merged
 * Merge branch 'master' into stage
 * Merge branch 'master' into stage
 * yo
 * fixed missing )
 * Merge branch 'master' into stage
 * Merge branch 'master' of vcs.diamonddogs.cc:globalrockstar-api
 * bugfixes
 * paypal verify stuff
 * still running property
 * Merge branch 'payment'
 * Implement API IPN handler
 * add twitter config to test
 * use micropayment on stage for deposit account
 * fix strict mode issue
 * Merge branch 'master' of vcs.diamonddogs.cc:globalrockstar-api
 * do not update twitter on test
 * Merge branch 'master' of vcs.diamonddogs.cc:globalrockstar-api
 * createdAt in contestMeta
 * add missing oauth
 * Merge branch 'master' of vcs.diamonddogs.cc:globalrockstar-api
 * add endpoint for cached twitter config
 * merged
 * paypal verify mailer
 * Start implementing IPN handling
 * trying to fix stats
 * scheduled mailer stuff
 * Merge branch 'master' into stage
 * Merge branch 'master' of vcs.diamonddogs.cc:globalrockstar-api
 * generate chart entries
 * increment serie
 * added ios and android voteTypes
 * fix pre save hook not returning
 * added serie voteType
 * Merge branch 'master' of vcs.diamonddogs.cc:globalrockstar-api
 * update charts in post save, not pre save
 * Merge branch 'master' of vcs.diamonddogs.cc:globalrockstar-api
 * also populate state
 * various bugfixes
 * state is a weird object use _doc
 * set frontend url to https
 * Merge branch 'master' of vcs.diamonddogs.cc:globalrockstar-api
 * use live paypal data
 * merged
 * artist statistics changes
 * Merge branch 'master' of vcs.diamonddogs.cc:globalrockstar-api
 * update detail-stats TODO: check property for nPos and pos without agg-functions
 * Merge branch 'master' of vcs.diamonddogs.cc:globalrockstar-api
 * Remove commented code
 * Merge branch 'master' of vcs.diamonddogs.cc:globalrockstar-api
 * fixes
 * Merge branch 'master' of vcs.diamonddogs.cc:globalrockstar-api
 * Only display Artist shares in CVS Export of Project donations
 * Merge branch 'master' of vcs.diamonddogs.cc:globalrockstar-api
 * swap live stage paypal config
 * Merge branch 'master' of vcs.diamonddogs.cc:globalrockstar-api
 * buh
 * project earnings
 * Merge branch 'master' of vcs.diamonddogs.cc:globalrockstar-api
 * add badge runner
 * added lastname and firstname to random fans property in artist detail route
 * validate action for songs
 * Dont't show transfer payments in Bank Order by date desc - to show news Payments on top
 * Merge branch 'master' into payment
 * Merge branch 'master' of vcs.diamonddogs.cc:globalrockstar-api
 * adds artist data for media library and packages
 * Swap priomary/Secondary receiver Set feePayer setting to SECONDARYONLY
 * PayPal live setting in stage config
 * Implement Transfer payments
 * added routes for payments
 * added song meta to songs show action
 * bugfix
 * Merge branch 'master' of vcs.diamonddogs.cc:globalrockstar-api
 * bugfix
 * rm coverage
 * fix comma
 * remove consoles
 * round all shares in payment
 * * Removed obsolete usedGRCollectiveMobileAddress * Basic inline source docs for artist payout delayed transfer properties * Implement listArtistPendingTransfers methiod
 * Add mandatory 'platform' attribute to payment. Move Vote specific create Method to vote plugin.
 * increment voteTypes for paltform
 * added mobile voteTypes
 * Reenable Payment tests and make them run
 * Merge branch 'master' of vcs.diamonddogs.cc:globalrockstar-api
 * added totalPlays to stats output
 * Merge branch 'crowdfunding'
 * bugfix if no songs is nominated
 * Merge branch 'master' into crowdfunding
 * Unpublish project email notification
 * refactored statistics endpoint
 * Merge branch 'master' of vcs.diamonddogs.cc:globalrockstar-api
 * updated statistics
 * kibana db-states board schema
 * and again
 * only show active songs in fake charts
 * es import script
 * fix vote serie comparison
 * unfix notices
 * fix notice
 * stuff
 * fake charts
 * es
 * Fetch artist info for email notification
 * typo
 * dd good
 * Merge branch 'stage' of vcs.diamonddogs.cc:globalrockstar-api into stage
 * added newrelic
 * yo+
 * add semicolons
 * use query for count
 * import votes update
 * fan populate stuff
 * refacgored the artist detail route
 * song meta calculation via aggregates
 * added some query logic to votes controllers
 * add sort by recoommendation to artists GR-776
 * removed worker and events for artist-statistics
 * removed fake fan charts
 * add recommendation sort possibbility to contestants GR-775
 * added artist-detail controller
