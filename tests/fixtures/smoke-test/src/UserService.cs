// Intentionally bad code for smoke testing
// Contains patterns that should be caught by review

namespace SmokeTest;

public class UserService
{
    private readonly HttpClient _client;

    public UserService()
    {
        _client = new HttpClient();
    }

    // BAD: async void
    public async void LoadUser(int id)
    {
        var response = await _client.GetAsync($"/users/{id}");
        var content = await response.Content.ReadAsStringAsync();
        Console.WriteLine(content);
    }

    // BAD: blocking on async
    public string GetUserSync(int id)
    {
        var result = _client.GetStringAsync($"/users/{id}").Result;
        return result;
    }

    // BAD: no null check
    public string GetDisplayName(User user)
    {
        return user.FirstName + " " + user.LastName;
    }

    // BAD: SQL injection (simulated)
    public void SaveNote(int userId, string note)
    {
        var sql = "INSERT INTO notes (user_id, content) VALUES (" + userId + ", '" + note + "')";
        // ExecuteSql(sql);
    }

    // BAD: long method (>30 lines when expanded)
    public void ProcessUser(User user)
    {
        if (user == null) return;
        Console.WriteLine("Step 1");
        Console.WriteLine("Step 2");
        Console.WriteLine("Step 3");
        Console.WriteLine("Step 4");
        Console.WriteLine("Step 5");
        Console.WriteLine("Step 6");
        Console.WriteLine("Step 7");
        Console.WriteLine("Step 8");
        Console.WriteLine("Step 9");
        Console.WriteLine("Step 10");
        Console.WriteLine("Step 11");
        Console.WriteLine("Step 12");
        Console.WriteLine("Step 13");
        Console.WriteLine("Step 14");
        Console.WriteLine("Step 15");
        Console.WriteLine("Step 16");
        Console.WriteLine("Step 17");
        Console.WriteLine("Step 18");
        Console.WriteLine("Step 19");
        Console.WriteLine("Step 20");
        Console.WriteLine("Step 21");
        Console.WriteLine("Step 22");
        Console.WriteLine("Step 23");
        Console.WriteLine("Step 24");
        Console.WriteLine("Step 25");
        Console.WriteLine("Step 26");
        Console.WriteLine("Step 27");
        Console.WriteLine("Step 28");
        Console.WriteLine("Step 29");
        Console.WriteLine("Step 30");
        Console.WriteLine("Step 31");
        Console.WriteLine("Done");
    }
}

public class User
{
    public string FirstName { get; set; }
    public string LastName { get; set; }
}
