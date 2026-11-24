const $ = (id) => document.getElementById(id);
const money = (n) => new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(n || 0);
const monthKey = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;
};
const monthName = (key) => new Date(key+"-01T00:00:00").toLocaleDateString("en-IN",{month:"long",year:"numeric"});
const today = new Date();
const currentKey = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}`;
const storageKey = "spendwise-transactions-v1";
const API_URL = "http://localhost:5000/api/transactions";
const budgetKey = "spendwise-budgets-v1";
let transactions = JSON.parse(localStorage.getItem(storageKey) || "null");
let budgets = JSON.parse(localStorage.getItem(budgetKey) || "null");
if (!transactions) {
  const year=today.getFullYear(), m=today.getMonth();
  const date=(day)=>`${year}-${String(m+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
  transactions=[
    {id:1,title:"Monthly Salary",amount:30000,type:"income",category:"Salary",date:date(1),description:"Monthly income"},
    {id:2,title:"Grocery shopping",amount:2500,type:"expense",category:"Food",date:date(4),description:"Weekly groceries"},
    {id:3,title:"Cab & travel",amount:1200,type:"expense",category:"Travel",date:date(8),description:"Local commute"},
    {id:4,title:"Online course",amount:1500,type:"expense",category:"Education",date:date(12),description:"Learning subscription"},
    {id:5,title:"Movie & snacks",amount:800,type:"expense",category:"Entertainment",date:date(16),description:"Weekend outing"}
  ];
  localStorage.setItem(storageKey,JSON.stringify(transactions));
}
if (!budgets) { budgets={}; localStorage.setItem(budgetKey,JSON.stringify(budgets)); }
let selectedMonth=currentKey, editingId=null, categoryChart=null, comparisonChart=null;
const categories={expense:["Food","Shopping","Transportation","Education","Entertainment","Healthcare","Other"],income:["Salary","Refund","Other"]};
function save(){localStorage.setItem(storageKey,JSON.stringify(transactions));localStorage.setItem(budgetKey,JSON.stringify(budgets));}
async function loadTransactions() {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) throw new Error("Failed to fetch transactions");

    transactions = await response.json();
    renderAll();

  } catch (error) {
    console.error("Error loading transactions:", error);
    showToast("Could not load transactions");
  }
}
function monthTransactions(key=selectedMonth){return transactions.filter(t=>monthKey(t.date)===key);}
function totals(key=selectedMonth){const list=monthTransactions(key);return {income:list.filter(t=>t.type==="income").reduce((s,t)=>s+t.amount,0),expense:list.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0)};}
function ratio(key=selectedMonth){return budgets[key]??70;}
function allocation(key=selectedMonth){const t=totals(key),r=ratio(key),spend=t.income*r/100,savings=t.income-spend,used=Math.max(0,t.expense-spend);return {...t,spend,savings,used,remaining:savings-used,shortfall:Math.max(0,t.expense-t.income),r};}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function showToast(message){const el=$("toast");el.textContent=message;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),2300);}
function populateMonthSelect(){
  const keys=new Set([currentKey,...transactions.map(t=>monthKey(t.date))]);
  for(let i=1;i<=11;i++){const d=new Date(today.getFullYear(),today.getMonth()-i,1);keys.add(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`);}
  const sorted=[...keys].sort().reverse();
  $("month-select").innerHTML=sorted.map(k=>`<option value="${k}">${monthName(k)}</option>`).join("");
  $("month-select").value=selectedMonth;
}
function renderOverview(){
  const a=allocation(),list=monthTransactions().sort((x,y)=>y.date.localeCompare(x.date));
  $("month-label").textContent=monthName(selectedMonth);
  $("total-income").textContent=money(a.income);$("total-expense").textContent=money(a.expense);
  $("spending-budget").textContent=money(a.spend);$("savings-remaining").textContent=money(Math.max(0,a.remaining));
  const percent=a.spend?Math.round(a.expense/a.spend*100):0;
  $("budget-percent").textContent=`${percent}% used`;$("budget-progress").style.width=`${Math.min(100,percent)}%`;
  $("budget-progress").style.background=percent>=100?"#d97969":"#217b5b";
  $("spent-label").textContent=money(a.expense);$("budget-label").textContent=money(a.spend);
  const alert=$("budget-alert");
  if(a.shortfall>0){alert.className="alert-box danger";alert.innerHTML=`<span>!</span><div><strong>Spending exceeds total income</strong><p>You have a financial shortfall of ${money(a.shortfall)}.</p></div>`;}
  else if(a.expense>a.spend){alert.className="alert-box warning";alert.innerHTML=`<span>!</span><div><strong>You're using your savings allocation</strong><p>${money(a.used)} of planned savings has been used.</p></div>`;}
  else if(a.spend>0&&a.expense>=a.spend*.8){alert.className="alert-box warning";alert.innerHTML=`<span>!</span><div><strong>You're approaching your budget limit</strong><p>You've used at least 80% of your spending budget.</p></div>`;}
  else {alert.className="alert-box";alert.innerHTML=`<span>✦</span><div><strong>You're on track</strong><p>Your spending is within your planned budget.</p></div>`;}
  const daysInMonth=new Date(Number(selectedMonth.slice(0,4)),Number(selectedMonth.slice(5,7)),0).getDate();
  const elapsed=selectedMonth===currentKey?Math.max(1,today.getDate()):daysInMonth;
  const prediction=a.expense/elapsed*daysInMonth;
  $("predicted-expense").textContent=money(prediction);
  $("prediction-note").textContent=prediction>a.spend&&a.spend>0?"At this pace, you may exceed your spending budget.":"An estimate based on recorded spending, not a guaranteed outcome.";
  $("recent-rows").innerHTML=list.slice(0,5).map(rowHtml).join("")||`<tr><td colspan="4">No transactions for this month yet.</td></tr>`;
}
function rowHtml(t){return `<tr><td><span class="transaction-name">${escapeHtml(t.title)}</span></td><td><span class="category-chip">${escapeHtml(t.category)}</span></td><td>${new Date(t.date+"T00:00:00").toLocaleDateString("en-IN",{day:"2-digit",month:"short"})}</td><td class="${t.type==="income"?"amount-income":"amount-expense"}">${t.type==="income"?"+":"−"}${money(t.amount)}</td></tr>`;}
function renderTransactions(){
  const q=$("search-input").value.toLowerCase();
  const list=monthTransactions().filter(t=>`${t.title} ${t.category} ${t.description}`.toLowerCase().includes(q)).sort((a,b)=>b.date.localeCompare(a.date));
  $("transaction-count").textContent=`${list.length} record${list.length===1?"":"s"}`;
  $("all-rows").innerHTML=list.map(t=>`<tr><td><span class="transaction-name">${escapeHtml(t.title)}</span><br><small>${escapeHtml(t.description||"")}</small></td><td><span class="category-chip">${escapeHtml(t.category)}</span></td><td>${new Date(t.date+"T00:00:00").toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}</td><td>${t.type==="income"?"Income":"Expense"}</td><td class="${t.type==="income"?"amount-income":"amount-expense"}">${t.type==="income"?"+":"−"}${money(t.amount)}</td><td><button class="action-btn" data-edit="${t._id}">Edit</button><button class="action-btn delete"data-delete="${t._id}">Delete</button></td></tr>`).join("");
  $("transaction-empty").classList.toggle("hidden",list.length!==0);
}
function renderBudget(){
  const a=allocation();$("allocation-income").textContent=money(a.income);$("spend-range").value=a.r;
  $("spend-percent").textContent=`${a.r}%`;$("allocation-spend").textContent=money(a.spend);$("allocation-save").textContent=money(a.savings);
  $("actual-expenses").textContent=money(a.expense);$("savings-used").textContent=money(a.used);$("remaining-savings-detail").textContent=money(Math.max(0,a.remaining));
  $("financial-status").textContent=a.shortfall?`Shortfall ${money(a.shortfall)}`:a.used? "Using savings":"On track";
}
function renderHistory(){
  const keys=new Set(transactions.map(t=>monthKey(t.date)));keys.add(currentKey);
  $("history-list").innerHTML=[...keys].sort().reverse().map(k=>{const a=allocation(k);return `<div class="history-item" data-history="${k}"><div><strong>${monthName(k)}</strong><small>Income ${money(a.income)} · Expenses ${money(a.expense)}</small></div><div class="history-right"><strong>${money(Math.max(0,a.remaining))}</strong><small>Final savings · Open →</small></div></div>`;}).join("");
}
function renderCharts(){
  $("analysis-month").textContent=monthName(selectedMonth);
  if(!window.Chart){return;}
  const list=monthTransactions().filter(t=>t.type==="expense"),map={};list.forEach(t=>map[t.category]=(map[t.category]||0)+t.amount);
  if(categoryChart)categoryChart.destroy();
  categoryChart=new Chart($("category-chart"),{type:"doughnut",data:{labels:Object.keys(map),datasets:[{data:Object.values(map),backgroundColor:["#287c5c","#9bc9ae","#d8b88a","#8b80bd","#df8e7f","#81a7b9","#c2cbc5"],borderWidth:3,borderColor:"#fff"}]},options:{maintainAspectRatio:false,plugins:{legend:{position:"bottom",labels:{usePointStyle:true,boxWidth:7,font:{size:10}}}}}});
  const keys=[];for(let i=5;i>=0;i--){const d=new Date(Number(selectedMonth.slice(0,4)),Number(selectedMonth.slice(5,7))-1-i,1);keys.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`);}
  const inc=keys.map(k=>totals(k).income),exp=keys.map(k=>totals(k).expense),labels=keys.map(monthName);
  if(comparisonChart)comparisonChart.destroy();
  comparisonChart=new Chart($("comparison-chart"),{type:"bar",data:{labels,datasets:[{label:"Income",data:inc,backgroundColor:"#8fc5a5",borderRadius:5},{label:"Expenses",data:exp,backgroundColor:"#d98b7e",borderRadius:5}]},options:{maintainAspectRatio:false,scales:{x:{grid:{display:false},ticks:{font:{size:9}}},y:{beginAtZero:true,ticks:{font:{size:9},callback:v=>"₹"+v.toLocaleString("en-IN")}}},plugins:{legend:{position:"bottom",labels:{usePointStyle:true,boxWidth:7,font:{size:10}}}}}});
}
function renderAll(){populateMonthSelect();renderOverview();renderTransactions();renderBudget();renderHistory();if($("page-analysis").classList.contains("active"))renderCharts();}
function openForm(t=null){
  console.log("OPEN FORM CALLED");
  editingId=t?._id??null;$("transaction-form").classList.remove("hidden");console.log("FORM CLASS:", $("transaction-form").className);$("form-heading").textContent=t?"Edit transaction":"Add a transaction";
  $("title-input").value=t?.title||"";$("amount-input").value=t?.amount||"";$("type-input").value=t?.type||"expense";
  updateCategories(t?.category);$("date-input").value=t?.date?.slice(0,10)||`${selectedMonth}-${String(Math.min(today.getDate(),new Date(Number(selectedMonth.slice(0,4)),Number(selectedMonth.slice(5,7)),0).getDate())).padStart(2,"0")}`;
  $("description-input").value=t?.description||"";$("transaction-form").scrollIntoView({behavior:"smooth",block:"start"});
}
function updateCategories(selected){const type=$("type-input").value;$("category-input").innerHTML=categories[type].map(c=>`<option>${c}</option>`).join("");if(selected&&categories[type].includes(selected))$("category-input").value=selected;}
function navigate(page){
  document.querySelectorAll(".page").forEach(p=>p.classList.remove("active"));$(`page-${page}`).classList.add("active");
  document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.page===page));
  const titles={overview:"Overview",transactions:"Transactions",budget:"Budget & savings",analysis:"Spending analysis",history:"Monthly history",sms:"SMS import"};$("page-title").textContent=titles[page];
  if(page==="analysis")renderCharts();
}
$("navigation").addEventListener("click",e=>{const b=e.target.closest("[data-page]");if(b)navigate(b.dataset.page);});
document.querySelectorAll("[data-goto]").forEach(b=>b.addEventListener("click",()=>navigate(b.dataset.goto)));
$("month-select").addEventListener("change",e=>{selectedMonth=e.target.value;renderAll();});
$("top-add").addEventListener("click",()=>{navigate("transactions");openForm();});
$("show-form").addEventListener("click",()=>openForm());
$("close-form").addEventListener("click",()=>$("transaction-form").classList.add("hidden"));
$("cancel-form").addEventListener("click",()=>$("transaction-form").classList.add("hidden"));
$("type-input").addEventListener("change",()=>updateCategories());

$("transaction-form").addEventListener("submit", async (e) => {
  e.preventDefault();

  const date = $("date-input").value;

  if (monthKey(date) !== selectedMonth) {
    showToast("Choose a date in the selected month.");
    return;
  }

  const item = {
    title: $("title-input").value.trim(),
    amount: Number($("amount-input").value),
    type: $("type-input").value,
    category: $("category-input").value,
    date,
    description: $("description-input").value.trim()
  };

  if (!item.title || !Number.isFinite(item.amount) || item.amount <= 0) {
    showToast("Enter a valid title and amount.");
    return;
  }

 
try {
  const isEditing = editingId !== null;

  const response = await fetch(
    isEditing ? `${API_URL}/${editingId}` : API_URL,
    {
      method: isEditing ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(item)
    }
  );

  if (!response.ok) {
    throw new Error("Failed to save transaction");
  }

  const savedTransaction = await response.json();

  if (isEditing) {
    transactions = transactions.map(t =>
      t._id === editingId ? savedTransaction : t
    );
  } else {
    transactions.push(savedTransaction);
  }

  $("transaction-form").classList.add("hidden");
  renderAll();

  showToast(isEditing
    ? "Transaction updated successfully!"
    : "Transaction added successfully!"
  );

  editingId = null;

} catch (error) {
  console.error(error);
  showToast("Could not save transaction");
}
});

$("all-rows").addEventListener("click", async (e) => {
  const edit = e.target.closest("[data-edit]");
  const del = e.target.closest("[data-delete]");

  if (edit) {
    const t = transactions.find(x => x._id === edit.dataset.edit);
    if (t) openForm(t);
  }

  if (del) {
    const id = del.dataset.delete;

    if (!confirm("Delete this transaction?")) return;

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE"
      });

      if (!response.ok) throw new Error("Delete failed");

      transactions = transactions.filter(t => t._id !== id);
      renderAll();
      showToast("Transaction deleted successfully!");
    } catch (error) {
      console.error(error);
      showToast("Could not delete transaction");
    }
  }
});

$("search-input").addEventListener("input",renderTransactions);
$("spend-range").addEventListener("input",e=>{budgets[selectedMonth]=Number(e.target.value);save();renderBudget();renderOverview();});
$("history-list").addEventListener("click",e=>{const item=e.target.closest("[data-history]");if(item){selectedMonth=item.dataset.history;renderAll();$("month-select").value=selectedMonth;navigate("overview");}});
$("parse-sms").addEventListener("click",()=>{
  const text=$("sms-input").value.trim(),amountMatch=text.match(/(?:rs\.?|inr|₹)\s*([\d,]+(?:\.\d{1,2})?)/i)||text.match(/([\d,]+(?:\.\d{1,2})?)\s*(?:rs\.?|inr|₹)/i);
  if(!text||!amountMatch){showToast("Could not find amount. Try a message containing Rs. 450.");return;}
  const amount=Number(amountMatch[1].replace(/,/g,"")),lower=text.toLowerCase(),type=/credited|received|deposited/.test(lower)?"income":"expense";
  const merchant=(text.match(/(?:at|to)\s+([A-Za-z0-9 &.-]+?)(?:\s+on\s+|\s+ref|\s+txn|$)/i)||[])[1]||"Imported transaction";
  $("sms-result").classList.remove("hidden");$("sms-result").innerHTML=`<strong>Details identified (please verify)</strong>Amount: ${money(amount)}<br>Type: ${type}<br>Merchant: ${escapeHtml(merchant)}<br><button class="primary-btn" id="confirm-sms" style="margin-top:12px">Confirm & add transaction</button>`;
  
$("confirm-sms").addEventListener("click", async () => {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title: merchant.trim(),
        amount,
        type,
        category: "Other",
        date: `${selectedMonth}-01`,
        description: "Imported from pasted SMS"
      })
    });

    if (!response.ok) {
      throw new Error("SMS transaction save failed");
    }

    const savedTransaction = await response.json();

    transactions.push(savedTransaction);
    renderAll();

    $("sms-input").value = "";
    $("sms-result").classList.add("hidden");

    showToast("SMS transaction saved successfully!");

  } catch (error) {
    console.error(error);
    showToast("Could not save SMS transaction");
  }
});

});
loadTransactions();

