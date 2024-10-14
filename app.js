document.getElementById('signUpBtn').onclick = function() {
  document.getElementById('modal').style.display = 'block';
}

document.getElementById('closeBtn').onclick = function() {
  document.getElementById('modal').style.display = 'none';
}

window.onclick = function(event) {
  if (event.target == document.getElementById('modal')) {
    document.getElementById('modal').style.display = 'none';
  }
}

document.getElementById('saveBtn').onclick = async function() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  const response = await fetch('/signup', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });

  if (response.ok) {
    alert('User created successfully!');
    document.getElementById('modal').style.display = 'none';
  } else {
    alert('Error creating user.');
  }
}
