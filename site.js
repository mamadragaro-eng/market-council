/* Market Council: favourites (☆ stays on top) and a filter box for long tables.
   Stars live only in this browser (localStorage); nothing is sent anywhere. */
(function () {
  "use strict";
  var KEY = "mc-favourites";
  var FILTER_MIN = 8; // tables with more instrument rows than this get a filter box

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch (e) { return []; }
  }
  function save(list) {
    try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) { /* private mode: stars last this visit */ }
  }
  var favs = load();
  function isFav(sym) { return favs.indexOf(sym) !== -1; }

  // A row plus the "Board notes" row that belongs to it.
  function group(row) {
    var rows = [row], next = row.nextElementSibling;
    while (next && !next.hasAttribute("data-sym") && next.classList.contains("why-row")) {
      rows.push(next);
      next = next.nextElementSibling;
    }
    return rows;
  }

  function tablesWithSymbols() {
    var out = [];
    document.querySelectorAll("table").forEach(function (t) {
      if (t.querySelector("tr[data-sym]")) out.push(t);
    });
    return out;
  }

  // Starred rows first (in their original order), then the rest.
  function arrange(table) {
    var rows = Array.prototype.slice.call(table.querySelectorAll("tr[data-sym]"));
    if (!rows.length) return;
    var body = rows[0].parentNode;
    var groups = rows.map(function (r, i) {
      if (!r.hasAttribute("data-order")) r.setAttribute("data-order", i);
      return group(r);
    });
    groups.sort(function (a, b) {
      var fa = isFav(a[0].getAttribute("data-sym")) ? 0 : 1, fb = isFav(b[0].getAttribute("data-sym")) ? 0 : 1;
      return fa - fb || a[0].getAttribute("data-order") - b[0].getAttribute("data-order");
    });
    groups.forEach(function (g) {
      var on = isFav(g[0].getAttribute("data-sym"));
      g.forEach(function (r) { r.classList.toggle("fav", on); body.appendChild(r); });
      var btn = g[0].querySelector(".star");
      if (btn) {
        btn.textContent = on ? "★" : "☆";
        btn.setAttribute("aria-pressed", on ? "true" : "false");
        btn.title = on ? "Remove from favourites" : "Add to favourites (stays on top)";
      }
    });
  }

  function refresh() { tablesWithSymbols().forEach(arrange); }

  function toggle(sym) {
    favs = isFav(sym) ? favs.filter(function (s) { return s !== sym; }) : favs.concat([sym]);
    save(favs);
    refresh();
  }

  function addStars(table) {
    table.querySelectorAll("tr[data-sym]").forEach(function (row) {
      var cell = row.querySelector("td");
      if (!cell || cell.querySelector(".star")) return;
      var sym = row.getAttribute("data-sym");
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "star";
      btn.setAttribute("aria-label", "Favourite " + sym);
      btn.addEventListener("click", function () { toggle(sym); });
      cell.insertBefore(btn, cell.firstChild);
    });
  }

  function addFilter(table) {
    var rows = table.querySelectorAll("tr[data-sym]");
    if (rows.length <= FILTER_MIN) return;
    var box = document.createElement("input");
    box.type = "search";
    box.className = "filter";
    box.placeholder = "Filter instruments…";
    box.setAttribute("aria-label", "Filter instruments in this table");
    box.addEventListener("input", function () {
      var q = box.value.trim().toLowerCase();
      table.querySelectorAll("tr[data-sym]").forEach(function (row) {
        var hit = !q || row.textContent.toLowerCase().indexOf(q) !== -1;
        group(row).forEach(function (r) { r.hidden = !hit; });
      });
    });
    var anchor = table.closest(".scroll") || table;
    anchor.parentNode.insertBefore(box, anchor);
  }

  function init() {
    var tables = tablesWithSymbols();
    if (!tables.length) return;
    tables.forEach(function (t) { addStars(t); addFilter(t); });
    refresh();
    document.querySelectorAll(".fav-hint").forEach(function (el) { el.hidden = false; });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
