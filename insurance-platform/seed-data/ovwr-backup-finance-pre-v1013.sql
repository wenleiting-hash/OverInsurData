--
-- PostgreSQL database dump
--

\restrict LGuTjdmhSuq9XVn5ekQlHyhPcFtrByeEAwm3GpkXDLLviMwGK6xfVwyPC8zfjuH

-- Dumped from database version 16.14
-- Dumped by pg_dump version 16.14

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: carrier_settlement_config; Type: TABLE DATA; Schema: public; Owner: overinsur
--

COPY public.carrier_settlement_config (config_id, carrier_id, partnership_id, cycle, bill_cutoff_day, payment_term_days, payment_method, billing_format, api_enabled, premium_collection, updated_by, last_updated, deleted, created_at, updated_at) FROM stdin;
config001	c1001	coop001	Monthly	25	30	ACH	EDI	t	AgencyBill	Emily Chen	2024-08-15	f	2026-09-07 06:51:45.138736+00	2026-09-07 06:51:45.138736+00
config002	c1002	coop002	Quarterly	20	45	Wire	Excel	f	DirectBill	Kevin Wang	2024-07-20	f	2026-09-07 06:51:45.138736+00	2026-09-07 06:51:45.138736+00
config003	c1003	coop003	Monthly	28	30	EFT	API	t	AgencyBill	Michael Thompson	2024-06-10	f	2026-09-07 06:51:45.138736+00	2026-09-07 06:51:45.138736+00
config004	c1005	coop005	Monthly	25	30	ACH	EDI	t	AgencyBill	Lisa Anderson	2024-09-01	f	2026-09-07 06:51:45.138736+00	2026-09-07 06:51:45.138736+00
config005	c1004	coop004	Quarterly	15	45	Wire	Excel	f	DirectBill	David Martinez	2025-01-10	f	2026-09-07 06:51:45.138736+00	2026-09-07 06:51:45.138736+00
cfgmtw8g6x3	cmtvpe2oa	coopmtw8g6t6	Quarterly	20	45	Wire	API	t	DirectBill	admin	2026-09-11	f	2026-09-11 00:43:27.880537+00	2026-09-11 00:43:27.890386+00
cfgmtw8h9jx	cmtvpe2og	coopmtw8h9gp	Monthly	18	45	Wire	API	t	DirectBill	admin	2026-09-11	f	2026-09-11 00:44:17.951372+00	2026-09-11 01:24:43.500293+00
\.


--
-- Data for Name: commission_bill; Type: TABLE DATA; Schema: public; Owner: overinsur
--

COPY public.commission_bill (bill_id, file_name, insurer_id, insurer_name, insurer_short, period, import_date, imported_by, file_size, file_format, status, total_policies, total_premium, total_commission, parsed_policies, matched_policies, exception_count, reconciled_amount, difference_amount, settled_date, deleted, created_at, updated_at) FROM stdin;
cbmtr2ymps	test.csv	c1001	\N	\N	2026-Q1	2026-09-07 10:10:59.58636+00	System Auto	1024	CSV	parsed	0	0.00	0.00	0	0	0	0.00	0.00	\N	f	2026-09-07 10:10:59.58636+00	2026-09-07 10:10:59.619227+00
cbmtr8qs6z	FT-statement-20260907.csv	c1001	Travelers	TRV	2026-09	2026-09-07 12:52:51.131957+00	System Auto	24KB	CSV	parsed	150	75000.00	7500.00	150	0	0	0.00	0.00	\N	f	2026-09-07 12:52:51.131957+00	2026-09-07 12:52:51.226341+00
\.


--
-- Data for Name: commission_bill_line; Type: TABLE DATA; Schema: public; Owner: overinsur
--

COPY public.commission_bill_line (line_id, bill_id, line_number, policy_number, insured_name, channel_id, channel_name, state, line_of_business, effective_date, premium, commission_rate, commission_amount, our_policy_number, our_commission_rate, our_commission_amount, diff_amount, match_status, diff_note, diff_note_en, deleted, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: reconciliation_diff; Type: TABLE DATA; Schema: public; Owner: overinsur
--

COPY public.reconciliation_diff (diff_id, bill_id, bill_name, insurer_id, insurer_short, policy_number, insured_name, diff_type, bill_amount, our_amount, diff_amount, status, note, note_en, assigned_to, created_date, resolved_date, deleted, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: settlement_cycle_config; Type: TABLE DATA; Schema: public; Owner: overinsur
--

COPY public.settlement_cycle_config (config_id, insurer_id, insurer_name, insurer_short, frequency, cutoff_day, payment_due_days, method, currency, min_settle_amount, auto_reconcile, auto_settle, notify_days_before, bank_account, routing_number, contact_email, last_settled_date, next_due_date, next_due_amount, ytd_settled, deleted, created_at, updated_at) FROM stdin;
scmtr2ymrn	c1001	\N	\N	quarterly	20	45	ach	USD	2000.00	t	f	7	\N	\N	\N	\N	\N	\N	0.00	t	2026-09-07 10:10:59.653082+00	2026-09-07 10:10:59.674266+00
scmtr8qsgb	c1001	Travelers	TRV	quarterly	25	30	ach	USD	0.00	f	t	7	\N	\N	\N	\N	\N	\N	0.00	t	2026-09-07 12:52:51.467969+00	2026-09-07 12:52:51.554569+00
\.


--
-- PostgreSQL database dump complete
--

\unrestrict LGuTjdmhSuq9XVn5ekQlHyhPcFtrByeEAwm3GpkXDLLviMwGK6xfVwyPC8zfjuH

