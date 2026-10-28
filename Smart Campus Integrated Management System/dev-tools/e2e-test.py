import subprocess, time, sys, os, json
from playwright.sync_api import sync_playwright
R="/mnt/user-data/outputs/Smart Campus Integrated Management System"
SH=R+"/docs/screenshots"
srv=subprocess.Popen(["node","server.js","8099"],cwd=R+"/dev-tools/mock-api",stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL); time.sleep(1.2)
B="http://localhost:8099/"; res=[]
def ok(n,c,extra=""): res.append((n,bool(c))); print(("PASS " if c else "FAIL ")+n+(" "+extra if extra and not c else ""))
try:
 with sync_playwright() as p:
  br=p.chromium.launch(); 
  def ctx(w=1366,h=800): 
   c=br.new_context(viewport={"width":w,"height":h}); pg=c.new_page(); errs=[]; pg.on("pageerror",lambda e:errs.append(str(e))); return c,pg,errs
  def login(pg,u,pw="pass1234"):
   pg.goto(B+"login.html"); pg.fill("#username",u); pg.fill("#password",pw); pg.click("#submit")
  c,pg,errs=ctx()
  pg.goto(B+"login.html"); pg.screenshot(path=SH+"/01-login.png")
  pg.click("#submit"); ok("login empty validation", "required" in pg.inner_text("#username-err").lower() or "Enter" in pg.inner_text("#username-err"))
  login(pg,"student","wrong"); pg.wait_for_selector("#form-error:not([hidden])"); ok("login wrong password message", "Invalid" in pg.inner_text("#form-error"))
  pg.screenshot(path=SH+"/02-login-error.png")
  pg.fill("#password","pass1234"); pg.click("#submit"); pg.wait_for_url("**/student.html"); ok("student login redirects", True)
  pg.wait_for_selector(".stat .n"); ok("student overview real stats", pg.inner_text(".stat .n")=="2", pg.inner_text(".stat .n"))
  pg.screenshot(path=SH+"/03-student-overview.png",full_page=True)
  for h,name,txt in [("courses","04-student-courses","Database Systems"),("faculty","05-student-faculty","Kavita"),("activities","06-student-activities","Hackathon"),("bookings","07-student-bookings","Seminar Hall A"),("notifications","08-student-notifications","Welcome"),("profile","09-student-profile","CSE001")]:
   pg.goto(B+"student.html#"+h); pg.reload(); pg.wait_for_selector("table, .kv, .state",timeout=5000); pg.wait_for_timeout(300)
   ok("student "+h+" shows data", txt in pg.inner_text("#view")); pg.screenshot(path=SH+f"/{name}.png",full_page=True)
  # booking create + validation
  pg.goto(B+"student.html#bookings"); pg.wait_for_selector("text=+ New booking"); pg.click("text=+ New booking"); pg.wait_for_selector("dialog[open]")
  pg.click("dialog button[type=submit]"); ok("booking form validation", "required" in pg.inner_text("dialog").lower()); pg.screenshot(path=SH+"/10-booking-form-validation.png")
  pg.select_option("#"+pg.get_attribute("dialog select","id"),index=2)
  ids=pg.eval_on_selector_all("dialog input,dialog textarea","e=>e.map(x=>x.id)")
  pg.fill("#"+ids[0],"2030-01-05"); pg.fill("#"+ids[1],"14:00"); pg.fill("#"+ids[2],"13:00"); pg.fill("#"+ids[3],"Study group")
  pg.click("dialog button[type=submit]"); ok("end-before-start blocked","after start" in pg.inner_text("dialog"))
  pg.fill("#"+ids[2],"15:00"); pg.click("dialog button[type=submit]"); pg.wait_for_selector("dialog",state="detached"); pg.wait_for_timeout(500)
  ok("booking persisted via API", "Study group" in pg.inner_text("#view"))
  pg.reload(); pg.wait_for_selector("table"); ok("booking survives reload", "Study group" in pg.inner_text("#view"))
  # cancel w/ confirm
  pg.click("tr:has-text('Study group') >> text=Cancel"); pg.wait_for_selector("dialog[open]"); pg.screenshot(path=SH+"/11-confirm-dialog.png"); pg.click("dialog button[value=ok]"); pg.wait_for_timeout(600)
  ok("cancel booking", "CANCELLED" in pg.inner_text("tr:has-text('Study group')"))
  ok("student has no admin nav", pg.locator("text=Booking Approvals").count()==0)
  # notifications mark read + badge
  pg.goto(B+"student.html#notifications"); pg.wait_for_selector("table"); ok("bell badge shows unread", pg.inner_text("#bell-badge")=="1")
  pg.click("text=Mark as read"); pg.wait_for_timeout(700); ok("mark read clears badge", pg.is_hidden("#bell-badge"))
  # search empty state
  pg.goto(B+"student.html#courses"); pg.wait_for_selector("table"); pg.fill("input[type=search]","zzzz"); ok("search no-match empty state","No matching results" in pg.inner_text("#view"))
  # route guard
  pg.goto(B+"admin.html"); pg.wait_for_url("**/student.html"); ok("student blocked from admin page", True)
  # profile menu + logout
  pg.click("#profile-btn"); pg.screenshot(path=SH+"/12-profile-menu.png"); pg.click("#logout-btn"); pg.click("dialog button[value=ok]"); pg.wait_for_url("**/login.html"); ok("logout", pg.evaluate("sessionStorage.getItem('scms.session')") is None)
  ok("no JS errors (student)", not errs, str(errs)); c.close()
  # FACULTY
  c,pg,errs=ctx(); login(pg,"faculty"); pg.wait_for_url("**/faculty.html"); pg.wait_for_selector(".stat .n")
  pg.screenshot(path=SH+"/13-faculty-overview.png",full_page=True)
  pg.goto(B+"faculty.html#students"); pg.wait_for_selector("table"); ok("faculty students list","Aarav" in pg.inner_text("#view")); pg.screenshot(path=SH+"/14-faculty-students.png",full_page=True)
  pg.goto(B+"faculty.html#courses"); pg.wait_for_selector("table"); ok("faculty courses","CS301" in pg.inner_text("#view"))
  pg.goto(B+"faculty.html#activities"); pg.wait_for_selector("table"); ok("faculty has no Register button", pg.locator("text=Register").count()==0)
  ok("no JS errors (faculty)", not errs, str(errs)); c.close()
  # ADMIN
  c,pg,errs=ctx(); login(pg,"admin"); pg.wait_for_url("**/admin.html"); pg.wait_for_selector(".stat .n")
  ok("admin stats from API", pg.locator(".stat").count()==6, str(pg.locator(".stat").count())); pg.screenshot(path=SH+"/15-admin-overview.png",full_page=True)
  pg.goto(B+"admin.html#students"); pg.wait_for_selector("table"); pg.click("text=+ Add student"); pg.wait_for_selector("dialog[open]")
  pg.click("dialog button[type=submit]"); ok("admin student form validation","required" in pg.inner_text("dialog").lower()); pg.screenshot(path=SH+"/16-admin-add-student-validation.png")
  ids=pg.eval_on_selector_all("dialog input,dialog select","e=>e.map(x=>x.id)")
  pg.fill("#"+ids[0],"CSE001"); pg.fill("#"+ids[1],"Dup Person"); pg.fill("#"+ids[2],"bad-email"); pg.click("dialog button[type=submit]"); ok("invalid email message","valid email" in pg.inner_text("dialog"))
  pg.fill("#"+ids[2],"dup@campus.edu"); pg.select_option("#"+ids[3],index=1); pg.fill("#"+ids[5],"5"); pg.fill("#"+ids[6],"password1"); pg.click("dialog button[type=submit]"); pg.wait_for_selector(".form-error:not([hidden])")
  ok("server 409 shown in form", "already exists" in pg.inner_text("dialog")); pg.screenshot(path=SH+"/17-admin-server-error.png")
  pg.fill("#"+ids[0],"CSE777"); pg.click("dialog button[type=submit]"); pg.wait_for_selector("dialog",state="detached"); pg.wait_for_timeout(500); ok("student created", "CSE777" in pg.inner_text("#view"))
  pg.screenshot(path=SH+"/18-admin-students.png",full_page=True)
  pg.click("tr:has-text('CSE777') >> text=Delete"); pg.wait_for_selector("dialog[open]"); pg.click("dialog button[value=ok]"); pg.wait_for_timeout(600); ok("student deleted","CSE777" not in pg.inner_text("#view"))
  for h,name,txt in [("faculty","19-admin-faculty","F100"),("courses","20-admin-courses","Kavita"),("resources","21-admin-resources","Lab 3"),("activities","22-admin-activities","Hackathon")]:
   pg.goto(B+"admin.html#"+h); pg.reload(); pg.wait_for_selector("table"); ok("admin "+h, txt in pg.inner_text("#view")); pg.screenshot(path=SH+f"/{name}.png",full_page=True)
  pg.goto(B+"admin.html#approvals"); pg.reload(); pg.wait_for_selector("table"); ok("approvals default pending","Club meeting" in pg.inner_text("#view")); pg.screenshot(path=SH+"/23-admin-approvals.png",full_page=True)
  pg.click("button:has-text(\"Approve\")"); pg.wait_for_selector("dialog[open]"); pg.click("dialog button[value=ok]"); pg.wait_for_timeout(700)
  ok("approve removes from pending view","Club meeting" not in pg.inner_text("#view") or "No matching" in pg.inner_text("#view"))
  pg.goto(B+"admin.html#reports"); pg.reload(); pg.wait_for_selector("table"); ok("report loads","CSE001" in pg.inner_text("#view")); pg.screenshot(path=SH+"/24-admin-reports.png",full_page=True)
  ok("no JS errors (admin)", not errs, str(errs)); c.close()
  # ERROR + 401 handling
  c,pg,errs=ctx(); login(pg,"student"); pg.wait_for_url("**/student.html")
  pg.route("**/api/students/me/courses", lambda r: r.fulfill(status=500,body="{}")); pg.goto(B+"student.html#courses"); pg.reload(); pg.wait_for_selector("[data-retry]"); ok("500 shows error + retry","Try again" in pg.inner_text("#view")); pg.screenshot(path=SH+"/25-error-state.png")
  pg.unroute("**/api/students/me/courses"); pg.route("**/api/**", lambda r: r.abort()); pg.goto(B+"student.html#courses"); pg.reload(); pg.wait_for_selector("[data-retry]",timeout=8000); ok("network down message","Cannot reach" in pg.inner_text("#view"))
  pg.unroute("**/api/**"); pg.route("**/api/**", lambda r: r.fulfill(status=401,body="{}")); pg.goto(B+"student.html#courses"); pg.reload(); pg.wait_for_url("**/login.html*"); ok("401 redirects to login", True); c.close()
  # MOBILE
  c,pg,errs=ctx(390,800); login(pg,"student"); pg.wait_for_url("**/student.html"); pg.wait_for_selector(".stat")
  ok("mobile: sidebar hidden", pg.evaluate("document.getElementById('sidebar').getBoundingClientRect().right")<=0)
  ok("mobile: no horizontal overflow", pg.evaluate("document.documentElement.scrollWidth<=window.innerWidth"), str(pg.evaluate("document.documentElement.scrollWidth")))
  pg.screenshot(path=SH+"/26-mobile-overview.png"); pg.click("#menu-btn"); pg.wait_for_timeout(300); pg.screenshot(path=SH+"/27-mobile-menu.png"); ok("mobile menu opens", pg.evaluate("document.getElementById('sidebar').getBoundingClientRect().left")>=0)
  pg.goto(B+"login.html"); c.close()
  br.close()
finally: srv.terminate()
f=[n for n,v in res if not v]; print(f"\n{len(res)-len(f)}/{len(res)} passed"); print("FAILED:",f)
