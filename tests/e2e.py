"""Test de bout en bout de StatuPub contre l'API réelle."""
import requests, sys, json

URL = "https://zqqtqopcrlxvsxvqmfjo.supabase.co"
KEY = "sb_publishable_ELwnBEHmoxzb1NemI_nAig_YdEish0f"
PW = "TestPass!2026"
ok = True

def check(name, cond, extra=""):
    global ok
    print(("  OK   " if cond else "  ECHEC") + f" {name} {extra}")
    ok = ok and cond

def login(email):
    r = requests.post(f"{URL}/auth/v1/token?grant_type=password", json={"email": email, "password": PW},
                      headers={"apikey": KEY})
    r.raise_for_status()
    return r.json()["access_token"]

def rpc(tok, fn, args=None):
    r = requests.post(f"{URL}/rest/v1/rpc/{fn}", json=args or {},
                      headers={"apikey": KEY, "Authorization": f"Bearer {tok}"})
    return r

PHONES = {}
def click(code, ua, ip_hdr=None):
    sess = PHONES.setdefault(ua, requests.Session())   # un téléphone = un navigateur avec ses cookies
    return sess.get(f"{URL}/functions/v1/go/{code}", headers={"User-Agent": ua}, allow_redirects=False)

A = login("test.annonceur@example.com")
D1 = login("test.diffuseur@example.com")
D2 = login("test.diffuseur2@example.com")
ADM = login("test.admin@example.com")
print("Connexion des 4 comptes OK")

print("\n1. Annonceur : recharge et campagne")
base = rpc(A, "annonceur_wallet").json()[0]["available"]
r = rpc(A, "create_campaign", {"p_title": "Promo test", "p_message": "Super promo", "p_media_url": "",
                               "p_target_url": "https://example.com/promo", "p_cpc": 25, "p_budget": base + 2500})
check("refus campagne au-delà du solde", r.status_code >= 400, r.json().get("message", ""))
r = rpc(A, "request_recharge", {"p_amount": 5000, "p_method": "wave", "p_reference": "TXN-TEST-001"})
check("demande de recharge", r.status_code == 200)
rid = r.json()
r = rpc(D1, "admin_process_recharge", {"p_id": rid, "p_approve": True})
check("un diffuseur ne peut pas valider", r.status_code >= 400)
r = rpc(ADM, "admin_process_recharge", {"p_id": rid, "p_approve": True})
check("admin valide la recharge", r.status_code in (200, 204))
w = rpc(A, "annonceur_wallet").json()[0]
check("solde annonceur +5000", w["available"] == base + 5000, str(w))
r = rpc(A, "create_campaign", {"p_title": "Promo Tabaski", "p_message": "Moutons à -20 % chez Awa !",
                               "p_media_url": "", "p_target_url": "https://example.com/promo", "p_cpc": 50, "p_budget": 2500})
check("création campagne (50 F/clic, 2500 F)", r.status_code == 200, str(r.json()))
cid = r.json()
w = rpc(A, "annonceur_wallet").json()[0]
check("budget de 2500 réservé", w["available"] == base + 2500, str(w))

print("\n2. Modération")
r = rpc(D1, "get_my_link", {"p_campaign": cid})
check("pas de lien avant validation", r.status_code >= 400)
r = rpc(ADM, "admin_review_campaign", {"p_id": cid, "p_approve": True})
check("admin approuve la campagne", r.status_code in (200, 204))

print("\n3. Diffuseur : lien unique")
camps = rpc(D1, "available_campaigns").json()
check("campagne visible côté diffuseur", any(c["id"] == cid for c in camps))
r = rpc(D1, "get_my_link", {"p_campaign": cid})
check("lien refusé si pas abonné à la Chaîne", r.status_code >= 400, r.json().get("message", ""))
requests.patch(f"{URL}/rest/v1/profiles?id=neq.00000000-0000-0000-0000-000000000000",
               json={"channel_joined": True, "avg_views": 300},
               headers={"apikey": KEY, "Authorization": f"Bearer {D1}"})
r = requests.patch(f"{URL}/rest/v1/profiles?id=neq.00000000-0000-0000-0000-000000000000", json={"role": "admin"},
                   headers={"apikey": KEY, "Authorization": f"Bearer {D1}", "Prefer": "return=representation"})
check("impossible de se mettre admin", r.status_code >= 400, str(r.status_code))
code = rpc(D1, "get_my_link", {"p_campaign": cid}).json()
check("lien obtenu", isinstance(code, str) and len(code) == 7, str(code))
code2 = rpc(D1, "get_my_link", {"p_campaign": cid}).json()
check("même lien au 2e appel", code == code2)

print("\n4. Clics et anti-fraude")
UA = "Mozilla/5.0 (Linux; Android 13; SM-A145F) AppleWebKit/537.36 Chrome/120.0 Mobile Safari/537.36"
r = click(code, "WhatsApp/2.24.1 A")
check("aperçu WhatsApp redirigé, non compté", r.status_code == 302)
r = click(code, UA)
check("vrai clic → redirection annonceur", r.status_code == 302 and r.headers.get("location") == "https://example.com/promo",
      r.headers.get("location", ""))
r = click(code, UA)
check("même visiteur re-clique → redirigé", r.status_code == 302)
r = click(code, "curl/8.0")
check("robot → redirigé", r.status_code == 302)
for i in range(3):
    click(code, UA.replace("SM-A145F", f"Phone{i}"))
r = click("ZZZZZZZ", UA)
check("code inconnu → 404", r.status_code == 404)

camp = [c for c in rpc(A, "annonceur_campaigns").json() if c["id"] == cid][0]
check("4 clics valides comptés", camp["valid_clicks"] == 4, f"valides={camp['valid_clicks']} invalides={camp['invalid_clicks']}")
check("clics invalides détectés (doublon + robot)", camp["invalid_clicks"] == 2)
check("dépense = 4 × 50 = 200 F", camp["spent"] == 200, str(camp["spent"]))
dw = rpc(D1, "diffuseur_wallet").json()[0]
check("gains diffuseur en attente ≥ 100 F (4 × 25)", dw["pending"] >= 100, str(dw))
r = rpc(D1, "request_withdrawal", {"p_amount": 1000, "p_method": "wave", "p_phone": "771234567"})
check("retrait refusé pendant le délai de contrôle", r.status_code >= 400, r.json().get("message", ""))

print("\n5. Cloisonnement des données")
r = requests.get(f"{URL}/rest/v1/clicks?select=id", headers={"apikey": KEY, "Authorization": f"Bearer {D2}"})
check("diffuseur 2 ne voit pas les clics du diffuseur 1", r.status_code == 200 and r.json() == [])
r = requests.get(f"{URL}/rest/v1/profiles?select=*", headers={"apikey": KEY})
check("anonyme ne voit aucun profil", r.status_code in (200, 401) and (r.status_code == 401 or r.json() == []))
r = rpc(A, "admin_overview")
check("annonceur n'a pas accès à l'admin", r.status_code >= 400)
ov = rpc(ADM, "admin_overview").json()
check("tableau de bord admin", ov["clics_valides_jour"] >= 4, json.dumps(ov))
r = requests.post(f"{URL}/rest/v1/rpc/record_click", json={"p_code": code, "p_visitor": "x", "p_ip": "y",
                  "p_country": "", "p_is_bot": False}, headers={"apikey": KEY, "Authorization": f"Bearer {D1}"})
check("impossible de fabriquer un clic via l'API", r.status_code >= 400)

print("\n6. Fin de campagne et remboursement du reste")
r = rpc(A, "set_campaign_status", {"p_id": cid, "p_status": "terminee"})
check("annonceur arrête la campagne", r.status_code in (200, 204))
w = rpc(A, "annonceur_wallet").json()[0]
check("budget non dépensé rendu (+4800 net)", w["available"] == base + 4800, str(w))
r = click(code, UA.replace("SM-A145F", "NewPhone"))
check("clic après arrêt → redirigé mais non payé", r.status_code == 302)
camp = [c for c in rpc(A, "annonceur_campaigns").json() if c["id"] == cid][0]
check("dépense inchangée", camp["spent"] == 200)

print("\nRÉSULTAT :", "TOUT EST OK" if ok else "DES TESTS ÉCHOUENT")
sys.exit(0 if ok else 1)
